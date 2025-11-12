import { ApiProperty } from '@nestjs/swagger';

/**
 * 系统信息 DTO
 */
export class SystemInfoDto {
  @ApiProperty({ description: '系统状态' })
  status: string;

  @ApiProperty({ description: '系统时间' })
  timestamp: string;

  @ApiProperty({ description: '系统运行时间（秒）' })
  uptime: number;

  @ApiProperty({ description: '环境' })
  environment: string;

  @ApiProperty({ description: '应用版本' })
  version: string;

  @ApiProperty({ description: '应用名称' })
  appName: string;

  @ApiProperty({ description: 'Node.js 版本' })
  nodeVersion: string;

  @ApiProperty({ description: '系统信息' })
  system: {
    platform: string;
    arch: string;
    cpus: number;
    hostname: string;
    type: string;
    release: string;
  };

  @ApiProperty({ description: '内存信息' })
  memory: {
    total: string;
    free: string;
    used: string;
    usagePercent: string;
    process: {
      heapTotal: string;
      heapUsed: string;
      external: string;
      rss: string;
      arrayBuffers: string;
    };
  };

  @ApiProperty({ description: 'CPU 信息' })
  cpu: {
    model: string;
    speed: string;
    cores: number;
    usage?: number;
  };
}
