import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';
import { SystemInfoDto } from './dto/system-info.dto';

/**
 * 系统信息服务
 */
@Injectable()
export class SystemService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 格式化字节大小
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * 获取系统信息
   */
  getSystemInfo(): SystemInfoDto {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

    const processMemory = process.memoryUsage();
    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Unknown';
    const cpuSpeed = cpus[0]?.speed ? `${cpus[0].speed} MHz` : 'Unknown';

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: this.configService.get('app.env', 'development'),
      version: this.configService.get('app.version', '1.0.0'),
      appName: this.configService.get('app.name', 'NestJS Server'),
      nodeVersion: process.version,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        hostname: os.hostname(),
        type: os.type(),
        release: os.release(),
      },
      memory: {
        total: this.formatBytes(totalMemory),
        free: this.formatBytes(freeMemory),
        used: this.formatBytes(usedMemory),
        usagePercent: `${memoryUsagePercent}%`,
        process: {
          heapTotal: this.formatBytes(processMemory.heapTotal),
          heapUsed: this.formatBytes(processMemory.heapUsed),
          external: this.formatBytes(processMemory.external),
          rss: this.formatBytes(processMemory.rss),
          arrayBuffers: this.formatBytes(processMemory.arrayBuffers),
        },
      },
      cpu: {
        model: cpuModel,
        speed: cpuSpeed,
        cores: cpus.length,
      },
    };
  }

  /**
   * 获取简化的健康检查信息
   */
  getHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
    };
  }
}
