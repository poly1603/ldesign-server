import { Module } from '@nestjs/common'
import { LauncherController } from './launcher.controller.js'
import { LauncherService } from './launcher.service.js'

/**
 * Application Launcher Module
 */
@Module({
  controllers: [LauncherController],
  providers: [LauncherService],
  exports: [LauncherService],
})
export class LauncherModule {}
