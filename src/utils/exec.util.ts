import { execa } from 'execa'
import { platform } from 'os'

/**
 * 命令执行工具
 * 提供跨平台的命令执行能力
 */
export class ExecUtil {
  /**
   * 执行命令并返回结果
   * @param command - 要执行的命令
   * @param args - 命令参数
   * @param options - 执行选项
   * @returns 命令执行结果
   */
  static async exec(
    command: string,
    args: string[] = [],
    options: {
      cwd?: string
      env?: Record<string, string>
      timeout?: number
    } = {},
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    try {
      const result = await execa(command, args, {
        cwd: options.cwd,
        env: options.env,
        timeout: options.timeout || 30000,
        shell: platform() === 'win32',
      })

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode || 0,
      }
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message || '',
        exitCode: error.exitCode || 1,
      }
    }
  }

  /**
   * 检查命令是否存在
   * @param command - 要检查的命令
   * @returns 命令是否存在
   */
  static async exists(command: string): Promise<boolean> {
    const isWindows = platform() === 'win32'
    const checkCommand = isWindows ? 'where' : 'which'

    try {
      const result = await this.exec(checkCommand, [command], { timeout: 5000 })
      return result.exitCode === 0 && result.stdout.trim().length > 0
    } catch {
      return false
    }
  }

  /**
   * 获取命令的完整路径
   * @param command - 命令名称
   * @returns 命令的完整路径，如果不存在则返回 null
   */
  static async which(command: string): Promise<string | null> {
    const isWindows = platform() === 'win32'
    const checkCommand = isWindows ? 'where' : 'which'

    try {
      const result = await this.exec(checkCommand, [command], { timeout: 5000 })
      if (result.exitCode === 0 && result.stdout.trim()) {
        return result.stdout.trim().split('\n')[0]
      }
      return null
    } catch {
      return null
    }
  }
}






















