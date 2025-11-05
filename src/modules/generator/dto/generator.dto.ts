import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * API Operation
 */
export enum GenerateType {
  COMPONENT = 'component',
  PAGE = 'page',
  API = 'api',
  SERVICE = 'service',
  MODEL = 'model',
  HOOK = 'hook',
  UTIL = 'util',
  TEST = 'test',
}

/**
 * API Operation
 */
export enum TemplateType {
  REACT = 'react',
  VUE = 'vue',
  ANGULAR = 'angular',
  SVELTE = 'svelte',
  NODE = 'node',
  EXPRESS = 'express',
  NESTJS = 'nestjs',
  CUSTOM = 'custom',
}

/**
 * API Operation
 */
export class GenerateCodeDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiProperty({
    description: '',
    enum: GenerateType,
    example: GenerateType.COMPONENT,
  })
  @IsEnum(GenerateType)
  type!: GenerateType

  @ApiProperty({ description: '', example: 'UserProfile' })
  @IsString()
  name!: string

  @ApiPropertyOptional({
    description: '',
    enum: TemplateType,
    example: TemplateType.REACT,
  })
  @IsOptional()
  @IsEnum(TemplateType)
  template?: TemplateType

  @ApiPropertyOptional({
    description: '',
    example: 'src/components',
  })
  @IsOptional()
  @IsString()
  output?: string

  @ApiPropertyOptional({
    description: '',
    example: { typescript: true, styles: 'scss' },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>

  @ApiPropertyOptional({ description: '', example: false })
  @IsOptional()
  @IsBoolean()
  overwrite?: boolean
}

/**
 * API Operation
 */
export class GenerateComponentDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiProperty({ description: '', example: 'UserCard' })
  @IsString()
  name!: string

  @ApiPropertyOptional({
    description: '',
    enum: TemplateType,
    example: TemplateType.REACT,
  })
  @IsOptional()
  @IsEnum(TemplateType)
  framework?: TemplateType

  @ApiPropertyOptional({ description: ' TypeScript', example: true })
  @IsOptional()
  @IsBoolean()
  typescript?: boolean

  @ApiPropertyOptional({ description: '', example: 'scss' })
  @IsOptional()
  @IsString()
  styles?: string

  @ApiPropertyOptional({ description: '', example: true })
  @IsOptional()
  @IsBoolean()
  withTests?: boolean

  @ApiPropertyOptional({ description: '', example: false })
  @IsOptional()
  @IsBoolean()
  withStories?: boolean
}

/**
 * API Operation
 */
export class GeneratePageDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiProperty({ description: '', example: 'UserProfile' })
  @IsString()
  name!: string

  @ApiPropertyOptional({ description: '', example: '/user/profile' })
  @IsOptional()
  @IsString()
  route?: string

  @ApiPropertyOptional({ description: '', example: true })
  @IsOptional()
  @IsBoolean()
  withLayout?: boolean

  @ApiPropertyOptional({ description: ' API ', example: true })
  @IsOptional()
  @IsBoolean()
  withApi?: boolean
}

/**
 * API Operation
 */
export class GenerateApiDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiProperty({ description: 'API ', example: 'user' })
  @IsString()
  name!: string

  @ApiPropertyOptional({ description: 'API ', example: '/api/users' })
  @IsOptional()
  @IsString()
  basePath?: string

  @ApiPropertyOptional({
    description: 'HTTP ',
    example: ['GET', 'POST', 'PUT', 'DELETE'],
  })
  @IsOptional()
  methods?: string[]

  @ApiPropertyOptional({ description: '', example: true })
  @IsOptional()
  @IsBoolean()
  withTypes?: boolean
}

/**
 * API Operation
 */
export class GetTemplatesDto {
  @ApiPropertyOptional({
    description: '',
    enum: TemplateType,
  })
  @IsOptional()
  @IsEnum(TemplateType)
  type?: TemplateType

  @ApiPropertyOptional({
    description: '',
    enum: GenerateType,
  })
  @IsOptional()
  @IsEnum(GenerateType)
  category?: GenerateType
}
