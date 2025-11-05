import { Injectable } from '@nestjs/common'
import { cpus, totalmem, freemem, platform, arch, uptime } from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

@Injectable()
export class HealthService {
  private startTime = Date.now()

  async getHealthStatus(): Promise<any> {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000)
    
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptime,
        formatted: this.formatUptime(uptime),
      },
      service: 'ldesign-tools-api',
      version: '1.0.0',
    }
  }

  async getSystemInfo(): Promise<any> {
    return {
      success: true,
      data: {
        platform: platform(),
        arch: arch(),
        cpus: cpus().length,
        totalMemory: totalmem(),
        freeMemory: freemem(),
        uptime: uptime(),
        nodeVersion: process.version,
      },
    }
  }

  async getDiskUsage(): Promise<any> {
    try {
      let command: string
      
      if (platform() === 'win32') {
        command = 'wmic logicaldisk get size,freespace,caption'
      } else {
        command = 'df -h'
      }

      const { stdout } = await execAsync(command)

      return {
        success: true,
        data: {
          raw: stdout,
          platform: platform(),
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to get disk usage',
        error: error.message,
      }
    }
  }

  async getMemoryUsage(): Promise<any> {
    const total = totalmem()
    const free = freemem()
    const used = total - free
    const usagePercent = ((used / total) * 100).toFixed(2)

    return {
      success: true,
      data: {
        total: total,
        totalFormatted: this.formatBytes(total),
        free: free,
        freeFormatted: this.formatBytes(free),
        used: used,
        usedFormatted: this.formatBytes(used),
        usagePercent: parseFloat(usagePercent),
        process: {
          heapTotal: process.memoryUsage().heapTotal,
          heapUsed: process.memoryUsage().heapUsed,
          external: process.memoryUsage().external,
          rss: process.memoryUsage().rss,
        },
      },
    }
  }

  async getCPUUsage(): Promise<any> {
    const cpuInfo = cpus()
    
    return {
      success: true,
      data: {
        count: cpuInfo.length,
        model: cpuInfo[0].model,
        speed: cpuInfo[0].speed,
        cores: cpuInfo.map((cpu, index) => ({
          core: index,
          model: cpu.model,
          speed: cpu.speed,
          times: cpu.times,
        })),
        average: this.getCPUAverage(),
      },
    }
  }

  private getCPUAverage(): any {
    const cpuInfo = cpus()
    let user = 0
    let nice = 0
    let sys = 0
    let idle = 0
    let irq = 0

    cpuInfo.forEach((cpu) => {
      user += cpu.times.user
      nice += cpu.times.nice
      sys += cpu.times.sys
      idle += cpu.times.idle
      irq += cpu.times.irq
    })

    const total = user + nice + sys + idle + irq

    return {
      user: ((user / total) * 100).toFixed(2) + '%',
      system: ((sys / total) * 100).toFixed(2) + '%',
      idle: ((idle / total) * 100).toFixed(2) + '%',
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    parts.push(`${secs}s`)

    return parts.join(' ')
  }
}
