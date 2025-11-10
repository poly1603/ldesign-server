import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsObject, IsOptional, IsNotEmpty } from 'class-validator'

/**
 * 获取 TypeScript 配置 DTO
 */
export class GetTypeScriptConfigDto {
  @ApiProperty({ description: '项目 ID' })
  @IsString()
  @IsNotEmpty()
  projectId!: string
}

/**
 * 更新 TypeScript 配置 DTO
 */
export class UpdateTypeScriptConfigDto {
  @ApiProperty({ description: '项目 ID' })
  @IsString()
  @IsNotEmpty()
  projectId!: string

  @ApiProperty({ description: 'TypeScript 配置对象' })
  @IsObject()
  @IsNotEmpty()
  config!: Record<string, any>
}

/**
 * 更新 TypeScript 版本 DTO
 */
export class UpdateTypeScriptVersionDto {
  @ApiProperty({ description: '项目 ID' })
  @IsString()
  @IsNotEmpty()
  projectId!: string

  @ApiProperty({ description: 'TypeScript 版本号', example: '5.7.3' })
  @IsString()
  @IsNotEmpty()
  version!: string
}

























