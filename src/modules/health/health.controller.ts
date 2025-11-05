import { Controller, Get } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { HealthService } from './health.service.js'

@ApiTags('health')
@Controller('api/health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get service health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved' })
  async getHealthStatus(): Promise<any> {
    return this.healthService.getHealthStatus()
  }

  @Get('system')
  @ApiOperation({ summary: 'Get system resources info' })
  @ApiResponse({ status: 200, description: 'System info retrieved' })
  async getSystemInfo(): Promise<any> {
    return this.healthService.getSystemInfo()
  }

  @Get('disk')
  @ApiOperation({ summary: 'Get disk usage' })
  @ApiResponse({ status: 200, description: 'Disk usage retrieved' })
  async getDiskUsage(): Promise<any> {
    return this.healthService.getDiskUsage()
  }

  @Get('memory')
  @ApiOperation({ summary: 'Get memory usage' })
  @ApiResponse({ status: 200, description: 'Memory usage retrieved' })
  async getMemoryUsage(): Promise<any> {
    return this.healthService.getMemoryUsage()
  }

  @Get('cpu')
  @ApiOperation({ summary: 'Get CPU usage' })
  @ApiResponse({ status: 200, description: 'CPU usage retrieved' })
  async getCPUUsage(): Promise<any> {
    return this.healthService.getCPUUsage()
  }
}
