import { platform } from 'os'
import { ExecUtil } from './exec.util.js'

/**
 * 包管理器类型
 */
export type PackageManagerType = 'chocolatey' | 'scoop'

/**
 * 包管理器信息
 */
export interface PackageManagerInfo {
  type: PackageManagerType
  installed: boolean
  path?: string
  version?: string
}

/**
 * 包管理器工具类
 * 支持 Chocolatey 和 Scoop 的检测和安装操作
 */
export class PackageManagerUtil {
  /**
   * 检测所有可用的包管理器
   * @returns 包管理器信息列表
   */
  static async detectAll(): Promise<PackageManagerInfo[]> {
    const results: PackageManagerInfo[] = []

    // 检测 Chocolatey
    const choco = await this.detectChocolatey()
    results.push(choco)

    // 检测 Scoop
    const scoop = await this.detectScoop()
    results.push(scoop)

    return results
  }

  /**
   * 检测 Chocolatey 是否安装
   * @returns Chocolatey 信息
   */
  static async detectChocolatey(): Promise<PackageManagerInfo> {
    const exists = await ExecUtil.exists('choco')
    if (!exists) {
      return {
        type: 'chocolatey',
        installed: false,
      }
    }

    const path = await ExecUtil.which('choco')
    const versionResult = await ExecUtil.exec('choco', ['--version'])

    return {
      type: 'chocolatey',
      installed: true,
      path: path || undefined,
      version: versionResult.stdout.trim() || undefined,
    }
  }

  /**
   * 检测 Scoop 是否安装
   * @returns Scoop 信息
   */
  static async detectScoop(): Promise<PackageManagerInfo> {
    const exists = await ExecUtil.exists('scoop')
    if (!exists) {
      return {
        type: 'scoop',
        installed: false,
      }
    }

    const path = await ExecUtil.which('scoop')
    const versionResult = await ExecUtil.exec('scoop', ['--version'])

    return {
      type: 'scoop',
      installed: true,
      path: path || undefined,
      version: versionResult.stdout.trim() || undefined,
    }
  }

  /**
   * 获取第一个可用的包管理器
   * @returns 第一个可用的包管理器，如果没有则返回 null
   */
  static async getFirstAvailable(): Promise<PackageManagerInfo | null> {
    const managers = await this.detectAll()
    return managers.find((m) => m.installed) || null
  }

  /**
   * 自动安装 Chocolatey（仅 Windows）
   * @returns 安装结果
   */
  static async installChocolatey(): Promise<{ success: boolean; message: string; output?: string }> {
    if (platform() !== 'win32') {
      return {
        success: false,
        message: 'Chocolatey 仅支持在 Windows 系统上安装',
      }
    }

    const detected = await this.detectChocolatey()
    if (detected.installed) {
      return {
        success: true,
        message: '已检测到 Chocolatey，无需重复安装',
      }
    }

    // 官方安装脚本
    const script = [
      'Set-ExecutionPolicy Bypass -Scope Process -Force',
      '[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072',
      "iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))",
    ].join('; ')

    const result = await ExecUtil.exec('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      script,
    ], {
      timeout: 600000,
    })

    if (result.exitCode === 0) {
      // 再次确认
      const confirm = await this.detectChocolatey()
      if (confirm.installed) {
        return {
          success: true,
          message: '成功安装 Chocolatey',
          output: result.stdout,
        }
      }
      return {
        success: false,
        message: '执行 Chocolatey 安装脚本后未检测到可用的 Chocolatey，请手动确认安装结果',
        output: result.stdout || result.stderr,
      }
    }

    return {
      success: false,
      message: `Chocolatey 安装失败: ${result.stderr || result.stdout || '未知错误'}`,
      output: result.stderr || result.stdout,
    }
  }

  /**
   * 自动安装 Scoop（仅 Windows）
   * @returns 安装结果
   */
  static async installScoop(): Promise<{ success: boolean; message: string; output?: string }> {
    if (platform() !== 'win32') {
      return {
        success: false,
        message: 'Scoop 仅支持在 Windows 系统上安装',
      }
    }

    const detected = await this.detectScoop()
    if (detected.installed) {
      return {
        success: true,
        message: '已检测到 Scoop，无需重复安装',
      }
    }

    const script = [
      'Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force',
      'irm get.scoop.sh | iex',
    ].join('; ')

    const result = await ExecUtil.exec('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      script,
    ], {
      timeout: 600000,
    })

    if (result.exitCode === 0) {
      const confirm = await this.detectScoop()
      if (confirm.installed) {
        return {
          success: true,
          message: '成功安装 Scoop',
          output: result.stdout,
        }
      }
      return {
        success: false,
        message: '执行 Scoop 安装脚本后未检测到可用的 Scoop，请手动确认安装结果',
        output: result.stdout || result.stderr,
      }
    }

    return {
      success: false,
      message: `Scoop 安装失败: ${result.stderr || result.stdout || '未知错误'}`,
      output: result.stderr || result.stdout,
    }
  }

  /**
   * 使用包管理器安装包
   * @param packageName - 要安装的包名
   * @param managerType - 包管理器类型，如果不指定则自动选择第一个可用的
   * @returns 安装结果
   */
  static async install(
    packageName: string,
    managerType?: PackageManagerType,
  ): Promise<{ success: boolean; message: string; output?: string }> {
    let manager: PackageManagerInfo | null

    if (managerType) {
      if (managerType === 'chocolatey') {
        manager = await this.detectChocolatey()
      } else {
        manager = await this.detectScoop()
      }
    } else {
      manager = await this.getFirstAvailable()
    }

    if (!manager || !manager.installed) {
      return {
        success: false,
        message: `未找到可用的包管理器。请先安装 Chocolatey 或 Scoop。`,
      }
    }

    try {
      let result

      if (manager.type === 'chocolatey') {
        result = await ExecUtil.exec('choco', ['install', packageName, '-y'], {
          timeout: 300000, // 5 分钟超时
        })
      } else {
        result = await ExecUtil.exec('scoop', ['install', packageName], {
          timeout: 300000,
        })
      }

      if (result.exitCode === 0) {
        return {
          success: true,
          message: `成功安装 ${packageName}`,
          output: result.stdout,
        }
      } else {
        return {
          success: false,
          message: `安装失败: ${result.stderr || result.stdout}`,
          output: result.stderr || result.stdout,
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
   * 获取包管理器的安装说明
   * @param managerType - 包管理器类型
   * @returns 安装说明
   */
  static getInstallInstructions(managerType: PackageManagerType): {
    name: string
    website: string
    installCommand: string
    description: string
  } {
    if (managerType === 'chocolatey') {
      return {
        name: 'Chocolatey',
        website: 'https://chocolatey.org/install',
        installCommand:
          'Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))',
        description:
          'Windows 包管理器，需要在管理员权限的 PowerShell 中运行安装命令',
      }
    } else {
      return {
        name: 'Scoop',
        website: 'https://scoop.sh/',
        installCommand:
          'Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force; irm get.scoop.sh | iex',
        description: 'Windows 命令行安装器，可在普通 PowerShell 中运行',
      }
    }
  }
}











