import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ProjectType } from '../entities/project.entity';

/**
 * 创建项目 DTO
 */
export class CreateProjectDto {
  @ApiProperty({ description: '项目名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: '项目路径' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({ description: '项目描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '项目版本', required: false })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({
    description: '项目类型',
    enum: ProjectType,
    required: false,
  })
  @IsEnum(ProjectType)
  @IsOptional()
  type?: ProjectType;

  @ApiProperty({ description: '框架类型', required: false })
  @IsString()
  @IsOptional()
  framework?: string;

  @ApiProperty({ description: '依赖列表', required: false })
  @IsOptional()
  dependencies?: Record<string, string>;
}

/**
 * 更新项目 DTO
 */
export class UpdateProjectDto {
  @ApiProperty({ description: '项目名称', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '项目描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '项目版本', required: false })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({
    description: '项目类型',
    enum: ProjectType,
    required: false,
  })
  @IsEnum(ProjectType)
  @IsOptional()
  type?: ProjectType;

  @ApiProperty({ description: '框架类型', required: false })
  @IsString()
  @IsOptional()
  framework?: string;
}

/**
 * 导入项目请求 DTO
 */
export class ImportProjectDto {
  @ApiProperty({ description: '项目目录路径' })
  @IsString()
  @IsNotEmpty()
  path: string;
}

/**
 * 项目信息响应 DTO
 */
export class ProjectInfoDto {
  @ApiProperty({ description: '项目名称' })
  name: string;

  @ApiProperty({ description: '项目路径' })
  path: string;

  @ApiProperty({ description: '项目描述' })
  description?: string;

  @ApiProperty({ description: '项目版本' })
  version?: string;

  @ApiProperty({ description: '项目类型', enum: ProjectType })
  type: ProjectType;

  @ApiProperty({ description: '框架类型' })
  framework?: string;

  @ApiProperty({ description: '是否有 package.json' })
  hasPackageJson: boolean;

  @ApiProperty({ description: '依赖列表' })
  dependencies?: Record<string, string>;
}
