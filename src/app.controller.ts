import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public, ResponseDto } from './common';

@ApiTags('应用信息')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '获取应用信息' })
  getHello(): ResponseDto<string> {
    const message = this.appService.getHello();
    return ResponseDto.success(message, '获取应用信息成功');
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: '健康检查' })
  getHealth(): ResponseDto<any> {
    const healthInfo = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    };
    return ResponseDto.success(healthInfo, '服务运行正常');
  }
}
