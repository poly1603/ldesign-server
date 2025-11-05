import { Module } from '@nestjs/common'
import { ToolManagerController } from './tool-manager.controller.js'
import { ToolManagerService } from './tool-manager.service.js'

/**
 * Tool Manager Module - Install/Uninstall Node, Git, NVM, etc.
 * Supports Windows and macOS
 */
@Module({
  controllers: [ToolManagerController],
  providers: [ToolManagerService],
  exports: [ToolManagerService],
})
export class ToolManagerModule {}
