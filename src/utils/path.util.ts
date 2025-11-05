import { existsSync, statSync, accessSync, constants } from 'fs'
import { resolve, normalize } from 'path'

/**
 * 路径工具类
 * 提供路径验证和处理功能
 */
export class PathUtil {
  /**
   * 验证路径是否存在
   * @param path - 要验证的路径
   * @returns 路径是否存在
   */
  static exists(path: string): boolean {
    try {
      return existsSync(path)
    } catch {
      return false
    }
  }

  /**
   * 验证路径是否为目录
   * @param path - 要验证的路径
   * @returns 是否为目录
   */
  static isDirectory(path: string): boolean {
    try {
      if (!this.exists(path)) {
        return false
      }
      const stats = statSync(path)
      return stats.isDirectory()
    } catch {
      return false
    }
  }

  /**
   * 验证路径是否为文件
   * @param path - 要验证的路径
   * @returns 是否为文件
   */
  static isFile(path: string): boolean {
    try {
      if (!this.exists(path)) {
        return false
      }
      const stats = statSync(path)
      return stats.isFile()
    } catch {
      return false
    }
  }

  /**
   * 验证路径是否可读
   * @param path - 要验证的路径
   * @returns 是否可读
   */
  static isReadable(path: string): boolean {
    try {
      accessSync(path, constants.R_OK)
      return true
    } catch {
      return false
    }
  }

  /**
   * 验证路径是否可写
   * @param path - 要验证的路径
   * @returns 是否可写
   */
  static isWritable(path: string): boolean {
    try {
      accessSync(path, constants.W_OK)
      return true
    } catch {
      return false
    }
  }

  /**
   * 规范化路径
   * @param path - 要规范化的路径
   * @returns 规范化后的路径
   */
  static normalize(path: string): string {
    return normalize(resolve(path))
  }

  /**
   * 综合验证路径
   * @param path - 要验证的路径
   * @param options - 验证选项
   * @returns 验证结果
   */
  static validate(
    path: string,
    options: {
      mustExist?: boolean
      mustBeDirectory?: boolean
      mustBeFile?: boolean
      mustBeReadable?: boolean
      mustBeWritable?: boolean
    } = {},
  ): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    const normalizedPath = this.normalize(path)

    if (options.mustExist !== false && !this.exists(normalizedPath)) {
      errors.push('路径不存在')
      return { valid: false, errors }
    }

    if (options.mustBeDirectory && !this.isDirectory(normalizedPath)) {
      errors.push('路径不是目录')
    }

    if (options.mustBeFile && !this.isFile(normalizedPath)) {
      errors.push('路径不是文件')
    }

    if (options.mustBeReadable && !this.isReadable(normalizedPath)) {
      errors.push('路径不可读')
    }

    if (options.mustBeWritable && !this.isWritable(normalizedPath)) {
      errors.push('路径不可写')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}





















