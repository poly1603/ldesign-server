import { INodeManager, NodeVersion } from './node-manager.interface.js'
import { ExecUtil } from '../../../utils/exec.util.js'

/**
 * nvs (Node Version Switcher) 管理器实现
 */
export class NvsManager implements INodeManager {
  readonly name = 'nvs'

  /**
   * 检测 nvs 是否已安装
   */
  async isInstalled(): Promise<boolean> {
    return ExecUtil.exists('nvs')
  }

  /**
   * 获取已安装的 Node 版本列表
   */
  async listVersions(): Promise<NodeVersion[]> {
    if (!(await this.isInstalled())) {
      return []
    }

    try {
      const result = await ExecUtil.exec('nvs', ['list'])
      const versions: NodeVersion[] = []

      if (result.exitCode !== 0) {
        return versions
      }

      // 解析 nvs list 输出
      // 示例输出：
      // node/18.17.0/x64
      // node/20.10.0/x64
      const lines = result.stdout.split('\n')
      const currentVersion = await this.getCurrentVersion()

      for (const line of lines) {
        const match = line.match(/node\/(\d+\.\d+\.\d+)/)
        if (match) {
          const version = match[1]
          versions.push({
            version,
            installed: true,
            active: version === currentVersion,
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
      // nvs 使用 node --version 来获取当前版本
      const result = await ExecUtil.exec('node', ['--version'])
      if (result.exitCode === 0 && result.stdout.trim()) {
        return result.stdout.trim().replace('v', '')
      }
      return null
    } catch {
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
        message: 'nvs 未安装',
      }
    }

    try {
      const result = await ExecUtil.exec('nvs', ['add', version], {
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
        message: 'nvs 未安装',
      }
    }

    try {
      const result = await ExecUtil.exec('nvs', ['use', version])

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
        message: 'nvs 未安装',
      }
    }

    try {
      const result = await ExecUtil.exec('nvs', ['remove', version])

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
      const result = await ExecUtil.exec('nvs', ['list', 'remote'])
      const versions: string[] = []

      if (result.exitCode === 0) {
        const lines = result.stdout.split('\n')
        for (const line of lines) {
          const match = line.match(/node\/(\d+\.\d+\.\d+)/)
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

