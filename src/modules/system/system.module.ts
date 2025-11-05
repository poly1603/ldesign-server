import { Module } from '@nestjs/common'
import { SystemController } from './system.controller.js'
import { SystemService } from './system.service.js'

/**
 * 系统工具模块
 */
@Module({
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}

