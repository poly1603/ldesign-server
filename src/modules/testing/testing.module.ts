import { Module } from '@nestjs/common'
import { TestingController } from './testing.controller.js'
import { TestingService } from './testing.service.js'

/**
 * Testing Module - Unit Tests, E2E, Coverage, Linting
 */
@Module({
  controllers: [TestingController],
  providers: [TestingService],
  exports: [TestingService],
})
export class TestingModule {}
