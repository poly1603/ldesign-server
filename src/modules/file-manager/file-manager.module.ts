import { Module } from '@nestjs/common'
import { FileManagerController } from './file-manager.controller.js'
import { FileManagerService } from './file-manager.service.js'

@Module({
  controllers: [FileManagerController],
  providers: [FileManagerService],
  exports: [FileManagerService],
})
export class FileManagerModule {}
