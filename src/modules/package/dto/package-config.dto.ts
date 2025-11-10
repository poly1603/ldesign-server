import { IsString, IsNotEmpty, IsObject, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/**
 * 获取 Package 配置 DTO
 */
export class GetPackageConfigDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string
}

/**
 * 更新 Package 配置 DTO
 */
export class UpdatePackageConfigDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string

  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  config!: Record<string, any>
}






















