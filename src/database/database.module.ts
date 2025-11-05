import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DatabaseService } from './database.service.js'
import { Project } from '../modules/project/entities/project.entity.js'

/**
 * 数据库模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
