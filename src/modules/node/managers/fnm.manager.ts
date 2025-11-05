import { INodeManager, NodeVersion } from './node-manager.interface.js'
import { ExecUtil } from '../../../utils/exec.util.js'

/**
 * fnm (Fast Node Manager) 管理器实现
 */
export class FnmManager implements INodeManager {
  readonly name = 'fnm'

  /**
   * 检测 fnm 是否已安装
   */
  async isInstalled(): Promise<boolean> {
    return ExecUtil.exists('fnm')
  }

  /**
   * 获取已安装的 Node 版本列表
   */
  async listVersions(): Promise<NodeVersion[]> {
    if (!(await this.isInstalled())) {
      return []
    }

    try {
      const result = await ExecUtil.exec('fnm', ['list'])
      const versions: NodeVersion[] = []

      if (result.exitCode !== 0) {
        return versions
      }

      // 解析 fnm list 输出
      // 示例输出：
      // v18.17.0
      // v20.10.0 default
      const lines = result.stdout.split('\n')
      const currentVersion = await this.getCurrentVersion()

      for (const line of lines) {
        const match = line.match(/v(\d+\.\d+\.\d+)/)
        if (match) {
          const version = match[1]
          const isDefault = line.includes('default')
          versions.push({
            version,
            installed: true,
            active: version === currentVersion || isDefault,
          })
        }
      }

      return versions
    } catch (error) {
      return []
    }
  }

  /**
   * 获取当前使用的 Node 版本
   */
  async getCurrentVersion(): Promise<string | null> {
    if (!(await this.isInstalled())) {
      return null
    }

    try {
      const result = await ExecUtil.exec('fnm', ['current'])
      if (result.exitCode === 0 && result.stdout.trim()) {
        return result.stdout.trim().replace('v', '')
      }
      return null
    } catch {
      // 如果 fnm current 失败，尝试使用 node --version
      try {
        const result = await ExecUtil.exec('node', ['--version'])
        if (result.exitCode === 0 && result.stdout.trim()) {
          return result.stdout.trim().replace('v', '')
        }
      } catch {
        // 忽略错误
      }
      return null
    }
  }

  /**
   * 安装指定版本的 Node.js
   */
  async installVersion(version: string): Promise<{ success: boolean; message: string }> {
    if (!(await this.isInstalled())) {
      return {
        success: false,
        message: 'fnm 未安装',
      }
    }

    try {
      const result = await ExecUtil.exec('fnm', ['install', version], {
        timeout: 300000, // 5 分钟超时
      })

      if (result.exitCode === 0) {
        return {
          success: true,
          message: `成功安装 Node.js ${version}`,
        }
      } else {
        return {
          success: false,
          message: `安装失败: ${result.stderr || result.stdout}`,
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `安装过程中发生错误: ${error.message}`,
      }
    }
  }

  /**
   * 切换到指定版本
   */
  async switchVersion(version: string): Promise<{ success: boolean; message: string }> {
    if (!(await this.isInstalled())) {
      return {
        success: false,
        message: 'fnm 未安装',
      }
    }

    try {
      // fnm 使用 use 命令切换版本
      const result = await ExecUtil.exec('fnm', ['use', version])

      if (result.exitCode === 0) {
        return {
          success: true,
          message: `已切换到 Node.js ${version}`,
        }
      } else {
        return {
          success: false,
          message: `切换失败: ${result.stderr || result.stdout}`,
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `切换过程中发生错误: ${error.message}`,
      }
    }
  }

  /**
   * 删除指定版本
   */
  async removeVersion(version: string): Promise<{ success: boolean; message: string }> {
    if (!(await this.isInstalled())) {
      return {
        success: false,
        message: 'fnm 未安装',
      }
    }

    try {
      const result = await ExecUtil.exec('fnm', ['uninstall', version])

      if (result.exitCode === 0) {
        return {
          success: true,
          message: `已删除 Node.js ${version}`,
        }
      } else {
        return {
          success: false,
          message: `删除失败: ${result.stderr || result.stdout}`,
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `删除过程中发生错误: ${error.message}`,
      }
    }
  }

  /**
   * 获取可用版本列表（从远程）
   */
  async listAvailableVersions(): Promise<string[]> {
    if (!(await this.isInstalled())) {
      return []
    }

    try {
      const result = await ExecUtil.exec('fnm', ['list-remote'])
      const versions: string[] = []

      if (result.exitCode === 0) {
        const lines = result.stdout.split('\n')
        for (const line of lines) {
          const match = line.match(/v(\d+\.\d+\.\d+)/)
          if (match) {
            versions.push(match[1])
          }
        }
      }

      return versions
    } catch {
      return []
    }
  }
}

