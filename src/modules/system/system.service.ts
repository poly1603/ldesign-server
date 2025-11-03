import { Injectable } from '@nestjs/common'
import { PathUtil } from '../../utils/path.util'

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
}

