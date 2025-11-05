import { Injectable } from '@nestjs/common'
import { PathUtil } from '../../utils/path.util.js'
import { ConfigService } from '../../config/config.service.js'
import { platform, arch, cpus, totalmem, freemem, uptime } from 'os'
import { execa } from 'execa'

/**
 * 路径验证结果
 */
export interface PathValidationResult {
  valid: boolean
  exists: boolean
  isDirectory: boolean
  isReadable: boolean
  isWritable: boolean
  errors: string[]
  normalizedPath: string
}

/**
 * 目录选择器信息
 */
export interface DirectoryPickerInfo {
  platform: string
  method: string
  description: string
  example?: string
}

/**
 * 系统工具服务
 */
@Injectable()
export class SystemService {
  constructor(private readonly configService: ConfigService) {}
  /**
   * 验证路径是否有效
   * @param path - 要验证的路径
   * @param options - 验证选项
   * @returns 验证结果
   */
  validatePath(
    path: string,
    options: {
      mustExist?: boolean
      mustBeDirectory?: boolean
      mustBeFile?: boolean
      mustBeReadable?: boolean
      mustBeWritable?: boolean
    } = {},
  ): PathValidationResult {
    const normalizedPath = PathUtil.normalize(path)
    const validation = PathUtil.validate(normalizedPath, options)

    return {
      valid: validation.valid,
      exists: PathUtil.exists(normalizedPath),
      isDirectory: PathUtil.isDirectory(normalizedPath),
      isReadable: PathUtil.isReadable(normalizedPath),
      isWritable: PathUtil.isWritable(normalizedPath),
      errors: validation.errors,
      normalizedPath,
    }
  }

  /**
   * 获取目录选择器信息
   * @returns 目录选择器信息
   */
  getDirectoryPickerInfo(): DirectoryPickerInfo {
    const platform = process.platform

    if (platform === 'win32') {
      return {
        platform: 'Windows',
        method: 'window.showDirectoryPicker()',
        description:
          '使用浏览器原生的 Directory Picker API 选择目录。需要在用户交互事件（如点击）中调用。',
        example: `
// 示例代码
async function selectDirectory() {
  try {
    const directoryHandle = await window.showDirectoryPicker()
    const path = directoryHandle.name // 获取目录名称
    // 注意：浏览器安全限制，无法直接获取完整路径
    // 需要将 directoryHandle 传递给后端进行处理
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('选择目录失败:', error)
    }
  }
}
        `.trim(),
      }
    } else if (platform === 'darwin') {
      return {
        platform: 'macOS',
        method: 'window.showDirectoryPicker()',
        description:
          '使用浏览器原生的 Directory Picker API 选择目录。需要在用户交互事件（如点击）中调用。',
        example: `
// 示例代码
async function selectDirectory() {
  try {
    const directoryHandle = await window.showDirectoryPicker()
    const path = directoryHandle.name
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('选择目录失败:', error)
    }
  }
}
        `.trim(),
      }
    } else {
      return {
        platform: 'Linux',
        method: 'window.showDirectoryPicker()',
        description:
          '使用浏览器原生的 Directory Picker API 选择目录。需要在用户交互事件（如点击）中调用。',
        example: `
// 示例代码
async function selectDirectory() {
  try {
    const directoryHandle = await window.showDirectoryPicker()
    const path = directoryHandle.name
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('选择目录失败:', error)
    }
  }
}
        `.trim(),
      }
    }
  }

  /**
   * 打开系统目录选择器
   * @param defaultPath - 默认路径（可选）
   * @returns 选择的目录路径
   */
  async openDirectoryPicker(defaultPath?: string): Promise<{ success: boolean; path?: string; message?: string }> {
    const currentPlatform = process.platform

    try {
      if (currentPlatform === 'win32') {
        // Windows: 使用 PowerShell 打开目录选择器
        // 注意：PowerShell 脚本需要使用单行格式，避免换行问题
        const selectedPath = defaultPath ? defaultPath.replace(/\\/g, '\\\\') : ''
        const script = selectedPath
          ? `Add-Type -AssemblyName System.Windows.Forms; $folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog; $folderBrowser.Description = "选择项目目录"; $folderBrowser.SelectedPath = "${selectedPath}"; if ($folderBrowser.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $folderBrowser.SelectedPath }`
          : `Add-Type -AssemblyName System.Windows.Forms; $folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog; $folderBrowser.Description = "选择项目目录"; if ($folderBrowser.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $folderBrowser.SelectedPath }`
        
        try {
          const result = await execa('powershell', ['-Command', script], {
            timeout: 60000,
            windowsVerbatimArguments: false,
          })

          if (result.stdout && result.stdout.trim()) {
            return {
              success: true,
              path: result.stdout.trim(),
            }
          }

          return {
            success: false,
            message: '用户取消了选择',
          }
        } catch (error: any) {
          // PowerShell 用户取消时 exitCode 为 1
          if (error.exitCode === 1 || error.code === 1) {
            return {
              success: false,
              message: '用户取消了选择',
            }
          }
          
          // 其他错误 - 记录详细错误信息
          console.error('PowerShell 执行失败:', error)
          return {
            success: false,
            message: error.message || error.stderr || 'PowerShell 执行失败',
          }
        }
      } else if (currentPlatform === 'darwin') {
        // macOS: 使用 AppleScript 打开目录选择器
        const script = `
          tell application "System Events"
            set folderPath to choose folder${defaultPath ? ` with prompt "选择项目目录" default location "${defaultPath}"` : ' with prompt "选择项目目录"'}
            return POSIX path of folderPath
          end tell
        `
        
        const result = await execa('osascript', ['-e', script], {
          timeout: 60000,
        })

        if (result.stdout && result.stdout.trim()) {
          return {
            success: true,
            path: result.stdout.trim(),
          }
        }

        return {
          success: false,
          message: '用户取消了选择',
        }
      } else {
        // Linux: 使用 zenity 或 kdialog
        try {
          const script = defaultPath
            ? `zenity --file-selection --directory --title="选择项目目录" --filename="${defaultPath}"`
            : 'zenity --file-selection --directory --title="选择项目目录"'
          
          const result = await execa('sh', ['-c', script], {
            timeout: 60000,
          })

          if (result.stdout && result.stdout.trim()) {
            return {
              success: true,
              path: result.stdout.trim(),
            }
          }
        } catch {
          // zenity 不可用，尝试 kdialog
          try {
            const script = defaultPath
              ? `kdialog --getexistingdirectory "${defaultPath}" "选择项目目录"`
              : 'kdialog --getexistingdirectory "选择项目目录"'
            
            const result = await execa('sh', ['-c', script], {
              timeout: 60000,
            })

            if (result.stdout && result.stdout.trim()) {
              return {
                success: true,
                path: result.stdout.trim(),
              }
            }
          } catch {
            return {
              success: false,
              message: '系统不支持目录选择器，请手动输入路径',
            }
          }
        }

        return {
          success: false,
          message: '用户取消了选择',
        }
      }
    } catch (error: any) {
      // 用户取消选择时，exitCode 通常为 1
      if (error.exitCode === 1 || error.code === 1) {
        return {
          success: false,
          message: '用户取消了选择',
        }
      }

      // 其他错误 - 记录详细错误信息
      console.error('打开目录选择器失败:', error)
      return {
        success: false,
        message: error.message || error.stderr || '打开目录选择器失败',
      }
    }
  }
}

