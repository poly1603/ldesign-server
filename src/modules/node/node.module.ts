import { Module } from '@nestjs/common'
import { NodeController } from './node.controller'
import { NodeService } from './node.service'

/**
 * Node 版本管理模块
 */
@Module({
  controllers: [NodeController],
  providers: [NodeService],
  exports: [NodeService],
})
export class NodeModule {}

