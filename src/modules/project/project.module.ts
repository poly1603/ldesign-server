import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectController } from './project.controller'
import { ProjectService } from './project.service'
import { Project } from './entities/project.entity'

/**
 * 项目管理模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}

