import { execa } from 'execa'
import { access } from 'fs/promises'
import { constants } from 'fs'
import { join } from 'path'
import { homedir, platform } from 'os'
import type { INodeManager, NodeVersion } from './node-manager.interface.js'
import { ExecUtil } from '../../../utils/exec.util.js'

/**
 * Volta 管理器实现
 * 官方站点: https://volta.sh
 */
export class VoltaManager implements INodeManager {
  readonly name = 'Volta'

  /**
   * 检测 Volta 是否已安装
   */
  async isInstalled(): Promise<boolean> {
    if (await ExecUtil.exists('volta')) {
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

    const result = await this.runVolta(['list', 'node', '--format', 'plain'])
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
      if (line.toLowerCase().startsWith('system')) {
        continue
      }

      const match = line.match(/node\s+v?(\d+\.\d+\.\d+)/i)
      if (match) {
        const version = match[1]
        const isDefault = /\(default\)/i.test(line)
        versions.push({
          version,
          installed: true,
          active: isDefault || version === currentVersion,
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

    const result = await this.runVolta(['current', 'node'])
    if (result.exitCode !== 0) {
      return null
    }

    const line = result.stdout.trim()
    if (!line || line.toLowerCase() === 'system') {
      return null
    }

    const match = line.match(/node@?v?(\d+\.\d+\.\d+)/i)
    return match ? match[1] : null
  }

  /**
   * 安装指定版本
   */
  async installVersion(version: string): Promise<{ success: boolean; message: string }> {
    if (!(await this.isInstalled())) {
      return {
        success: false,
        message: 'Volta 未安装',
      }
    }

    const result = await this.runVolta(['install', `node@${version}`], { timeout: 600000 })
    if (result.exitCode === 0) {
      return {
        success: true,
        message: `成功安装 Node.js ${version}`,
      }
    }

    return {
      success: false,
      message: result.stderr || result.stdout || `安装 Node.js ${version} 失败`,
    }
  }

  /**
   * 切换版本
   */
  async switchVersion(version: string): Promise<{ success: boolean; message: string }> {
    if (!(await this.isInstalled())) {
      return {
        success: false,
        message: 'Volta 未安装',
      }
    }

    const result = await this.runVolta(['install', `node@${version}`], { timeout: 600000 })
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
        message: 'Volta 未安装',
      }
    }

    const result = await this.runVolta(['uninstall', `node@${version}`], { timeout: 300000 })
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
   * 获取可用版本列表（Volta 暂不提供稳定的远程列表，交由上层服务兜底）
   */
  async listAvailableVersions(): Promise<string[]> {
    return []
  }

  /**
   * 运行 Volta 命令
   */
  private async runVolta(
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
          VOLTA_HOME: this.getVoltaHome(),
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
    if (await ExecUtil.exists('volta')) {
      return 'volta'
    }

    const candidates = this.getPossibleExecutables()
    for (const candidate of candidates) {
      if (await this.pathExists(candidate)) {
        return candidate
      }
    }

    return 'volta'
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

    if (currentPlatform === 'win32') {
      const localAppData = process.env.LOCALAPPDATA
      if (localAppData) {
        paths.push(join(localAppData, 'Volta', 'bin', 'volta.exe'))
      }
    } else {
      const home = homedir()
      paths.push(join(home, '.volta', 'bin', 'volta'))
    }

    return paths
  }

  /**
   * 获取 Volta Home 路径
   */
  private getVoltaHome(): string | undefined {
    const currentPlatform = platform()
    if (currentPlatform === 'win32') {
      const localAppData = process.env.LOCALAPPDATA
      if (localAppData) {
        return join(localAppData, 'Volta')
      }
    } else {
      const home = homedir()
      return join(home, '.volta')
    }
    return undefined
  }
}




