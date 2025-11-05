import { INodeManager, NodeVersion } from './node-manager.interface.js'
import { ExecUtil } from '../../../utils/exec.util.js'

/**
 * nvm-windows 管理器实现
 */
export class NvmWindowsManager implements INodeManager {
  readonly name = 'nvm-windows'

  /**
   * 检测 nvm-windows 是否已安装
   */
  async isInstalled(): Promise<boolean> {
    return ExecUtil.exists('nvm')
  }

  /**
   * 获取已安装的 Node 版本列表
   */
  async listVersions(): Promise<NodeVersion[]> {
    if (!(await this.isInstalled())) {
      return []
    }

    try {
      const result = await ExecUtil.exec('nvm', ['list'])
      const versions: NodeVersion[] = []

      if (result.exitCode !== 0) {
        return versions
      }

      // 解析 nvm list 输出
      // 示例输出：
      //     18.17.0
      //   * 20.10.0    (Currently using 64-bit executable)
      const lines = result.stdout.split('\n')
      let currentVersion: string | null = null

      // 提取当前版本
      const currentMatch = result.stdout.match(/\*?\s*(\d+\.\d+\.\d+).*Currently using/)
      if (currentMatch) {
        currentVersion = currentMatch[1]
      }

      for (const line of lines) {
        const match = line.match(/(\d+\.\d+\.\d+)/)
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
      const result = await ExecUtil.exec('nvm', ['current'])
      if (result.exitCode === 0 && result.stdout.trim()) {
        const version = result.stdout.trim()
        // nvm current 可能返回 "none" 如果没有设置
        return version !== 'none' ? version : null
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
        message: 'nvm-windows 未安装',
      }
    }

    try {
      const result = await ExecUtil.exec('nvm', ['install', version], {
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
        message: 'nvm-windows 未安装',
      }
    }

    try {
      const result = await ExecUtil.exec('nvm', ['use', version])

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
        message: 'nvm-windows 未安装',
      }
    }

    try {
      const result = await ExecUtil.exec('nvm', ['uninstall', version])

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
      const result = await ExecUtil.exec('nvm', ['list', 'available'])
      const versions: string[] = []

      if (result.exitCode === 0) {
        // 解析版本列表
        // 示例输出：
        // |   CURRENT    |     LTS      |  OLD STABLE  |  OLD UNSTABLE |
        // |--------------|--------------|--------------|---------------|
        // |    20.10.0   |   18.17.0    |   0.12.18    |   0.11.16     |
        const lines = result.stdout.split('\n')
        for (const line of lines) {
          const matches = line.match(/(\d+\.\d+\.\d+)/g)
          if (matches) {
            versions.push(...matches)
          }
        }
      }

      return versions
    } catch {
      return []
    }
  }
}

