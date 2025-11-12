import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { SystemInfoDto } from './dto/system-info.dto';
import { ApiSuccessResponse } from '../common/decorators/api-response.decorator';

/**
 * 系统信息控制器
 */
@ApiTags('system')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('info')
  @ApiOperation({ summary: '获取系统信息' })
  @ApiResponse({
    status: 200,
    description: '返回详细的系统信息',
    type: SystemInfoDto,
  })
  @ApiSuccessResponse('获取系统信息成功')
  getSystemInfo(): SystemInfoDto {
    return this.systemService.getSystemInfo();
  }

  @Get('health')
  @ApiOperation({ summary: '健康检查' })
  @ApiSuccessResponse('系统健康')
  getHealthCheck() {
    return this.systemService.getHealthCheck();
  }
}
