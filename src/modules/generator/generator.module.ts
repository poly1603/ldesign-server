import { Module } from '@nestjs/common'
import { GeneratorController } from './generator.controller.js'
import { GeneratorService } from './generator.service.js'

@Module({
  controllers: [GeneratorController],
  providers: [GeneratorService],
  exports: [GeneratorService],
})
export class GeneratorModule {}
