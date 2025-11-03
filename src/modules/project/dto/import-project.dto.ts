import { IsString, IsNotEmpty } from 'class-validator'

/**
 * 导入项目 DTO
 */
export class ImportProjectDto {
  /**
   * 项目路径
   */
  @IsString()
  @IsNotEmpty()
  path: string

  /**
   * 项目名称（可选，如果不提供则从路径提取）
   */
  @IsString()
  @IsNotEmpty()
  name?: string
}

