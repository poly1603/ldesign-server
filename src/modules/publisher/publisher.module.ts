import { Module } from '@nestjs/common'
import { PublisherController } from './publisher.controller.js'
import { PublisherService } from './publisher.service.js'

@Module({
  controllers: [PublisherController],
  providers: [PublisherService],
  exports: [PublisherService],
})
export class PublisherModule {}