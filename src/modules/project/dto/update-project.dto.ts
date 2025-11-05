import { IsString, IsOptional, IsEnum } from 'class-validator'
import { ProjectType } from '../entities/project.entity.js'

/**
 * 更新项目 DTO
 */
export class UpdateProjectDto {
  /**
   * 项目名称
   */
  @IsString()
  @IsOptional()
  name?: string

  /**
   * 项目路径
   */
  @IsString()
  @IsOptional()
  path?: string

  /**
   * 项目类型
   */
  @IsEnum(['web', 'api', 'library', 'mobile', 'desktop', 'other'])
  @IsOptional()
  type?: ProjectType

  /**
   * 框架类型
   */
  @IsString()
  @IsOptional()
  framework?: string

  /**
   * 包管理器
   */
  @IsString()
  @IsOptional()
  packageManager?: string

  /**
   * 项目描述
   */
  @IsString()
  @IsOptional()
  description?: string

  /**
   * 项目配置
   */
  @IsOptional()
  config?: any
}

