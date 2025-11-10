import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TypeScriptController } from './typescript.controller.js'
import { TypeScriptService } from './typescript.service.js'
import { DocumentController } from './document.controller.js'
import { DocumentService } from './document.service.js'
import { Document } from './entities/document.entity.js'
import { ProjectModule } from '../project/project.module.js'

/**
 * TypeScript 配置模块
 */
@Module({
  imports: [
    ProjectModule,
    TypeOrmModule.forFeature([Document]),
  ],
  controllers: [TypeScriptController, DocumentController],
  providers: [TypeScriptService, DocumentService],
  exports: [TypeScriptService, DocumentService],
})
export class TypeScriptModule {}




