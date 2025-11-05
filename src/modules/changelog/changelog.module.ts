import { Module } from '@nestjs/common'
import { ChangelogController } from './changelog.controller.js'
import { ChangelogService } from './changelog.service.js'

@Module({
  controllers: [ChangelogController],
  providers: [ChangelogService],
  exports: [ChangelogService],
})
export class ChangelogModule {}
