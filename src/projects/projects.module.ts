import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { ProjectOperation } from './entities/project-operation.entity';
import { OperationLog } from './entities/operation-log.entity';
import { LauncherService } from '../service/launcher.service';
import { LauncherGateway } from './launcher.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectOperation, OperationLog])],
  controllers: [ProjectsController],
  providers: [ProjectsService, LauncherService, LauncherGateway],
  exports: [ProjectsService, LauncherService],
})
export class ProjectsModule {}
