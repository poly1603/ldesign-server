import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PackageController } from './package.controller.js'
import { PackageService } from './package.service.js'
import { VersionBumpOption } from './entities/version-bump-option.entity.js'
import { BuilderOutputDir } from './entities/builder-output-dir.entity.js'
import { Project } from '../project/entities/project.entity.js'

/**
 * Package 配置模块
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([VersionBumpOption, BuilderOutputDir, Project]),
  ],
  controllers: [PackageController],
  providers: [PackageService],
  exports: [PackageService],
})
export class PackageModule {}










