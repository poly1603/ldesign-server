import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiSuccessResponse } from './common/decorators/api-response.decorator';

@ApiTags('default')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: '首页欢迎信息' })
  @ApiSuccessResponse('获取欢迎信息成功')
  getHello(): string {
    return this.appService.getHello();
  }
}
