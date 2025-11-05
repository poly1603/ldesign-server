import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ProjectController } from './project.controller.js'
import { ProjectService } from './project.service.js'
import { ProjectCommandService } from './project-command.service.js'
import { Project } from './entities/project.entity.js'
import { CommandExecution } from './entities/command-execution.entity.js'

/**
 * 项目管理模块
 */
@Module({
  imports: [TypeOrmModule.forFeature([Project, CommandExecution])],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectCommandService],
  exports: [ProjectService, ProjectCommandService],
})
export class ProjectModule {}

