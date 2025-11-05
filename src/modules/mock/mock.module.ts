import { Module } from '@nestjs/common'
import { MockController } from './mock.controller.js'
import { MockService } from './mock.service.js'

@Module({
  controllers: [MockController],
  providers: [MockService],
  exports: [MockService],
})
export class MockModule {}