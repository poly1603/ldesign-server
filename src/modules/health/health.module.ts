import { Module } from '@nestjs/common'
import { HealthController } from './health.controller.js'
import { HealthService } from './health.service.js'

/**
 * Health Check Module
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
