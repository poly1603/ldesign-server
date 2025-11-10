import { execa } from 'execa'
import { access } from 'fs/promises'
import { constants } from 'fs'
import { join } from 'path'
import { homedir, platform } from 'os'
import type { INodeManager, NodeVersion } from './node-manager.interface.js'
import { ExecUtil } from '../../../utils/exec.util.js'

/**
 * Mise 管理器实现
 * 官方站点: https://mise.jdx.dev
 */
export class MiseManager implements INodeManager {
  readonly name = 'Mise'

  /**
   * 检测 Mise 是否已安装
   */
  async isInstalled(): Promise<boolean> {
    if (await ExecUtil.exists('mise')) {
      return true
    }

    const candidates = this.getPossibleExecutables()
    for (const candidate of candidates) {
      if (await this.pathExists(candidate)) {
        return true
      }
    }

    return false
  }

  /**
   * 获取已安装版本列表
   */
  async listVersions(): Promise<NodeVersion[]> {
    if (!(await this.isInstalled())) {
      return []
    }

    const result = await this.runMise(['ls', 'node'])
    if (result.exitCode !== 0) {
      return []
    }

    const versions: NodeVersion[] = []
    const currentVersion = await this.getCurrentVersion()
    const lines = result.stdout
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)

    for (const line of lines) {
      // 可能的输出格式：
      // node 20.10.0 (current)
      // node 18.17.1
      const match = line.match(/node\s+v?(\d+\.\d+\.\d+)/i)
      if (match) {
        const version = match[1]
        const isCurrent = line.includes('(current)') || version === currentVersion
        versions.push({
          version,
          installed: true,
          active: isCurrent,
        })
      }
    }

    return versions
  }

  /**
   * 获取当前版本
   */
  async getCurrentVersion(): Promise<string | null> {
    if (!(await this.isInstalled())) {
      return null
    }

    const result = await this.runMise(['current', 'node'])
    if (result.exitCode !== 0) {
      return null
    }

    const line = result.stdout.trim()
    const match = line.match(/node\s+v?(\d+\.\d+\.\d+)/i)
    return match ? match[1] : null
  }

  /**
   * 安装指定版本
   */
  async installVersion(version: string): Promise<{ success: boolean; message: string }> {
    if (!(await this.isInstalled())) {
      return {
        success: false,
        message: 'Mise 未安装',
      }
    }

    // 安装并设置为全局版本
    const installResult = await this.runMise(['install', `node@${version}`], { timeout: 600000 })
    if (installResult.exitCode !== 0) {
      return {
        success: false,
        message: installResult.stderr || installResult.stdout || `安装 Node.js ${version} 失败`,
      }
    }

    const useResult = await this.runMise(['use', '--global', `node@${version}`], { timeout: 300000 })
    if (useResult.exitCode === 0) {
      return {
        success: true,
        message: `成功安装并切换到 Node.js ${version}`,
      }
    }

    return {
      success: false,
      message: useResult.stderr || useResult.stdout || `切换到 Node.js ${version} 失败`,
    }
  }

  /**
   * 切换版本
   */
  async switchVersion(version: string): Promise<{ success: boolean; message: string }> {
    if (!(await this.isInstalled())) {
      return {
        success: false,
        message: 'Mise 未安装',
      }
    }

    const result = await this.runMise(['use', '--global', `node@${version}`], { timeout: 300000 })
    if (result.exitCode === 0) {
      return {
        success: true,
        message: `已切换到 Node.js ${version}`,
      }
    }

    return {
      success: false,
      message: result.stderr || result.stdout || `切换到 Node.js ${version} 失败`,
    }
  }

  /**
   * 删除版本
   */
  async removeVersion(version: string): Promise<{ success: boolean; message: string }> {
    if (!(await this.isInstalled())) {
      return {
        success: false,
        message: 'Mise 未安装',
      }
    }

    const result = await this.runMise(['uninstall', `node@${version}`], { timeout: 300000 })
    if (result.exitCode === 0) {
      return {
        success: true,
        message: `已删除 Node.js ${version}`,
      }
    }

    return {
      success: false,
      message: result.stderr || result.stdout || `删除 Node.js ${version} 失败`,
    }
  }

  /**
   * 获取可用版本列表（交由上层服务兜底）
   */
  async listAvailableVersions(): Promise<string[]> {
    return []
  }

  /**
   * 运行 Mise 命令
   */
  private async runMise(
    args: string[],
    options: { timeout?: number } = {},
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      const command = await this.resolveExecutable()
      const result = await execa(command, args, {
        shell: false,
        timeout: options.timeout ?? 300000,
        env: {
          ...process.env,
          MISE_ENV: 'production',
        },
      })

      return {
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
        exitCode: result.exitCode ?? 0,
      }
    } catch (error: any) {
      return {
        stdout: error.stdout ?? '',
        stderr: error.stderr ?? error.message ?? '',
        exitCode: error.exitCode ?? 1,
      }
    }
  }

  /**
   * 解析可执行文件路径
   */
  private async resolveExecutable(): Promise<string> {
    if (await ExecUtil.exists('mise')) {
      return 'mise'
    }

    const candidates = this.getPossibleExecutables()
    for (const candidate of candidates) {
      if (await this.pathExists(candidate)) {
        return candidate
      }
    }

    return 'mise'
  }

  /**
   * 检查路径是否存在
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      await access(path, constants.X_OK)
      return true
    } catch {
      try {
        await access(path, constants.F_OK)
        return true
      } catch {
        return false
      }
    }
  }

  /**
   * 获取可能的可执行路径
   */
  private getPossibleExecutables(): string[] {
    const paths: string[] = []
    const currentPlatform = platform()
    const home = homedir()

    if (currentPlatform === 'win32') {
      const localAppData = process.env.LOCALAPPDATA
      if (localAppData) {
        paths.push(join(localAppData, 'mise', 'bin', 'mise.exe'))
      }
    } else {
      paths.push(join(home, '.local', 'share', 'mise', 'bin', 'mise'))
      paths.push(join(home, '.local', 'bin', 'mise'))
    }

    return paths
  }
}




