import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { ApiStandardResponse } from './common/decorators/api-response.decorator'
import { ConfigService } from './config/config.service'
import { os } from 'node:os'

/**
 * 健康检查响应数据
 */
class HealthDataDto {
  /** 服务状态 */
  status: string
  /** 时间戳 */
  timestamp: number
  /** 运行时长（秒） */
  uptime: number
  /** 系统信息 */
  system: {
    platform: string
    arch: string
    nodeVersion: string
    memory: {
      total: number
      free: number
      used: number
    }
  }
}

/**
 * 应用根控制器
 * 提供健康检查等基础接口
 */
@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 健康检查接口
   * 用于检查服务是否正常运行，返回服务状态和系统信息
   * @returns 健康状态信息
   */
  @Get('health')
  @ApiOperation({
    summary: '健康检查',
    description: '检查服务运行状态和系统信息',
  })
  @ApiStandardResponse(HealthDataDto, '服务健康状态')
  health() {
    const memory = os.totalmem()
    const freeMemory = os.freemem()

    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: Date.now(),
        uptime: Math.floor(process.uptime()),
        system: {
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          memory: {
            total: memory,
            free: freeMemory,
            used: memory - freeMemory,
          },
        },
      } as HealthDataDto,
    }
  }
}

