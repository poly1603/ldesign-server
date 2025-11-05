import { Module } from '@nestjs/common'
import { NodeController } from './node.controller.js'
import { NodeService } from './node.service.js'

/**
 * Node 版本管理模块
 */
@Module({
  controllers: [NodeController],
  providers: [NodeService],
  exports: [NodeService],
})
export class NodeModule {}

