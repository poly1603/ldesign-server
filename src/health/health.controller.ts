import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ApiSuccessResponse } from '../common/decorators/api-response.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: '健康检查' })
  @ApiSuccessResponse('系统健康')
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('app.env'),
      version: this.configService.get('app.version'),
      memory: {
        usage: process.memoryUsage(),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      },
    };
  }

  @Get('ping')
  @ApiOperation({ summary: 'Ping测试' })
  @ApiSuccessResponse('Pong')
  ping() {
    return { message: 'pong', timestamp: Date.now() };
  }
}
