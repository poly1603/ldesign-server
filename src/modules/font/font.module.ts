import { Module } from '@nestjs/common'
import { FontController } from './font.controller.js'
import { FontService } from './font.service.js'

/**
 * Font Extraction Module (Based on Fontmin)
 */
@Module({
  controllers: [FontController],
  providers: [FontService],
  exports: [FontService],
})
export class FontModule {}
