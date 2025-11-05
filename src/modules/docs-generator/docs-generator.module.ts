import { Module } from '@nestjs/common'
import { DocsGeneratorController } from './docs-generator.controller.js'
import { DocsGeneratorService } from './docs-generator.service.js'

@Module({
  controllers: [DocsGeneratorController],
  providers: [DocsGeneratorService],
  exports: [DocsGeneratorService],
})
export class DocsGeneratorModule {}