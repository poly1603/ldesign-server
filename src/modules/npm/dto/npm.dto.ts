import { IsString, IsOptional, IsBoolean, IsEmail, IsUrl, IsNumber, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type, Transform } from 'class-transformer'

/**
 * 创建 NPM 仓库配置 DTO
 */
export class CreateNpmRegistryDto {
  @ApiProperty({ description: '仓库名称', example: 'npm官方源' })
  @IsString()
  name: string

  @ApiProperty({ description: '仓库 URL', example: 'https://registry.npmjs.org/' })
  @IsUrl()
  registry: string

  @ApiPropertyOptional({ description: '是否为默认仓库', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @ApiPropertyOptional({ description: '排序', default: 0 })
  @IsOptional()
  order?: number
}

/**
 * 更新 NPM 仓库配置 DTO
 */
export class UpdateNpmRegistryDto {
  @ApiPropertyOptional({ description: '仓库名称' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: '仓库 URL' })
  @IsOptional()
  @IsUrl()
  registry?: string

  @ApiPropertyOptional({ description: '是否为默认仓库' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  order?: number
}

/**
 * NPM 登录 DTO
 */
export class NpmLoginDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  username: string

  @ApiProperty({ description: '密码' })
  @IsString()
  password: string

  @ApiPropertyOptional({ description: '邮箱' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiProperty({ description: '仓库 ID' })
  @IsString()
  registryId: string
}

/**
 * NPM 包信息 DTO
 */
export class NpmPackageInfoDto {
  @ApiProperty({ description: '包名' })
  name: string

  @ApiProperty({ description: '版本' })
  version: string

  @ApiPropertyOptional({ description: '描述' })
  description?: string

  @ApiPropertyOptional({ description: '作者' })
  author?: string

  @ApiPropertyOptional({ description: '发布时间' })
  publishTime?: string

  @ApiPropertyOptional({ description: '最新版本' })
  latest?: string
}

/**
 * 分页查询 DTO
 */
export class PaginationDto {
  @ApiPropertyOptional({ description: '页码', default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined
    }
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  @Type(() => Number)
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码必须大于0' })
  page?: number

  @ApiPropertyOptional({ description: '每页数量', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined
    }
    const num = Number(value)
    return isNaN(num) ? undefined : num
  })
  @Type(() => Number)
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Min(1, { message: '每页数量必须大于0' })
  @Max(100, { message: '每页数量不能超过100' })
  pageSize?: number
}

/**
 * 分页响应 DTO
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: '数据列表' })
  items: T[]

  @ApiProperty({ description: '总数' })
  total: number

  @ApiProperty({ description: '页码' })
  page: number

  @ApiProperty({ description: '每页数量' })
  pageSize: number

  @ApiProperty({ description: '总页数' })
  totalPages: number
}

