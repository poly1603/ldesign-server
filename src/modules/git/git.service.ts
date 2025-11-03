import { Injectable } from '@nestjs/common'
import { ExecUtil } from '../../utils/exec.util'
import { PackageManagerUtil } from '../../utils/package-manager.util'

/**
 * Git 状态信息
 */
export interface GitStatus {
  installed: boolean
  version?: string
  path?: string
}

/**
 * Git 配置信息
 */
export interface GitConfig {
  user?: {
    name?: string
    email?: string
  }
  [key: string]: any
}

/**
 * Git 服务
 * 提供 Git 环境检测和重装功能
 */
@Injectable()
export class GitService {
  /**
   * 检测 Git 安装状态
   * @returns Git 状态信息
   */
  async getStatus(): Promise<GitStatus> {
    const installed = await ExecUtil.exists('git')

    if (!installed) {
      return {
        installed: false,
      }
    }

    const path = await ExecUtil.which('git')
    const versionResult = await ExecUtil.exec('git', ['--version'])

    return {
      installed: true,
      version: versionResult.stdout.trim() || undefined,
      path: path || undefined,
    }
  }

  /**
   * 获取 Git 配置信息
   * @returns Git 配置
   */
  async getConfig(): Promise<GitConfig> {
    const installed = await this.getStatus()
    if (!installed.installed) {
      return {}
    }

    try {
      const config: GitConfig = {}

      // 获取用户名
      const nameResult = await ExecUtil.exec('git', ['config', '--global', 'user.name'])
      if (nameResult.exitCode === 0 && nameResult.stdout.trim()) {
        config.user = {
          name: nameResult.stdout.trim(),
        }
      }

      // 获取邮箱
      const emailResult = await ExecUtil.exec('git', ['config', '--global', 'user.email'])
      if (emailResult.exitCode === 0 && emailResult.stdout.trim()) {
        if (!config.user) {
          config.user = {}
        }
        config.user.email = emailResult.stdout.trim()
      }

      return config
    } catch (error) {
      return {}
    }
  }

  /**
   * 重新安装 Git
   * @param packageManager - 包管理器类型（可选）
   * @returns 安装结果
   */
  async reinstall(packageManager?: 'chocolatey' | 'scoop'): Promise<{
    success: boolean
    message: string
  }> {
    // 检查包管理器
    let manager: 'chocolatey' | 'scoop' | null = null

    if (packageManager) {
      if (packageManager === 'chocolatey') {
        const choco = await PackageManagerUtil.detectChocolatey()
        if (!choco.installed) {
          return {
            success: false,
            message: 'Chocolatey 未安装，请先安装 Chocolatey',
          }
        }
        manager = 'chocolatey'
      } else {
        const scoop = await PackageManagerUtil.detectScoop()
        if (!scoop.installed) {
          return {
            success: false,
            message: 'Scoop 未安装，请先安装 Scoop',
          }
        }
        manager = 'scoop'
      }
    } else {
      // 自动选择第一个可用的包管理器
      const available = await PackageManagerUtil.getFirstAvailable()
      if (!available) {
        return {
          success: false,
          message: '未找到可用的包管理器（Chocolatey 或 Scoop），请先安装其中一个',
        }
      }
      manager = available.type
    }

    // 使用包管理器安装 Git
    const result = await PackageManagerUtil.install('git', manager)

    return result
  }
}

