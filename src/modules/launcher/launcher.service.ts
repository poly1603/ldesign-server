import { Injectable } from '@nestjs/common'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import { LaunchAppDto, KillProcessDto, FindProcessDto } from './dto/launcher.dto.js'

const execAsync = promisify(exec)

@Injectable()
export class LauncherService {
  private runningProcesses: Map<number, any> = new Map()

  async launchApp(launchDto: LaunchAppDto): Promise<any> {
    const { app, args = [], cwd, wait = false } = launchDto

    try {
      if (wait) {
        const command = `${app} ${args.join(' ')}`
        const { stdout, stderr } = await execAsync(command, { cwd })
        return {
          success: true,
          message: 'Application executed successfully',
          output: stdout || stderr,
        }
      } else {
        const child = spawn(app, args, { cwd, detached: true, stdio: 'ignore' })
        child.unref()
        
        this.runningProcesses.set(child.pid!, child)

        return {
          success: true,
          message: 'Application launched',
          pid: child.pid,
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to launch application',
        error: error.message,
      }
    }
  }

  async killProcess(killDto: KillProcessDto): Promise<any> {
    const { pid } = killDto

    try {
      process.kill(pid)
      this.runningProcesses.delete(pid)

      return {
        success: true,
        message: `Process ${pid} killed successfully`,
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to kill process ${pid}`,
        error: error.message,
      }
    }
  }

  async listProcesses(): Promise<any> {
    try {
      const command = process.platform === 'win32' ? 'tasklist' : 'ps aux'
      const { stdout } = await execAsync(command)

      return {
        success: true,
        data: stdout.split('\n').slice(0, 50),
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to list processes',
        error: error.message,
      }
    }
  }

  async findProcess(findDto: FindProcessDto): Promise<any> {
    const { name } = findDto

    try {
      const command = process.platform === 'win32' 
        ? `tasklist /FI "IMAGENAME eq ${name}*"` 
        : `ps aux | grep ${name}`
      
      const { stdout } = await execAsync(command)

      return {
        success: true,
        data: stdout.split('\n').filter(line => line.trim()),
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to find process: ${name}`,
        error: error.message,
      }
    }
  }

  async getRunningProcesses(): Promise<any> {
    return {
      success: true,
      data: Array.from(this.runningProcesses.keys()),
      count: this.runningProcesses.size,
    }
  }
}
