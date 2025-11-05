import { Module } from '@nestjs/common'
import { GitController } from './git.controller.js'
import { GitService } from './git.service.js'

/**
 * Git 管理模块
 */
@Module({
  controllers: [GitController],
  providers: [GitService],
  exports: [GitService],
})
export class GitModule {}

