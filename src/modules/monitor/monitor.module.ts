import { Module } from '@nestjs/common'
import { MonitorController } from './monitor.controller.js'
import { MonitorService } from './monitor.service.js'

@Module({
  controllers: [MonitorController],
  providers: [MonitorService],
  exports: [MonitorService],
})
export class MonitorModule {}