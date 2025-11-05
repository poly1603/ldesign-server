import { Module } from '@nestjs/common'
import { DepsController } from './deps.controller.js'
import { DepsService } from './deps.service.js'

/**
 * Dependencies Management Module
 */
@Module({
  controllers: [DepsController],
  providers: [DepsService],
  exports: [DepsService],
})
export class DepsModule {}
