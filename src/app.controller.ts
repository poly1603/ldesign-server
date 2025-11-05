import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { ConfigService } from './config/config.service.js'
import * as os from 'os'
/**
 * API Operation
 */
class HealthDataDto {
  /**
 * API Operation
 */
  status: string
  /**
 * API Operation
 */
  timestamp: number
  /**
 * API Operation
 */
  uptime: number
  /**
 * API Operation
 */
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
 * API Operation
 */
@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  /**
 * API Operation
 */
  @Get('health')
  @ApiOperation({ summary: 'API Operation' })
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

