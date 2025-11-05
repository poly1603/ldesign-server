import { Module } from '@nestjs/common'
import { FormatterController } from './formatter.controller.js'
import { FormatterService } from './formatter.service.js'

@Module({
  controllers: [FormatterController],
  providers: [FormatterService],
  exports: [FormatterService],
})
export class FormatterModule {}