import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * API Operation
 */
export enum ChangelogFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  HTML = 'html',
}

/**
 * API Operation
 */
export class GenerateChangelogDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiPropertyOptional({ description: '', example: '1.0.0' })
  @IsOptional()
  @IsString()
  version?: string

  @ApiPropertyOptional({
    description: '',
    enum: ChangelogFormat,
    example: ChangelogFormat.MARKDOWN,
  })
  @IsOptional()
  @IsEnum(ChangelogFormat)
  format?: ChangelogFormat

  @ApiPropertyOptional({ description: '', example: 'CHANGELOG.md' })
  @IsOptional()
  @IsString()
  output?: string

  @ApiPropertyOptional({ description: '', example: true })
  @IsOptional()
  @IsBoolean()
  includeUnreleased?: boolean
}

/**
 * API Operation
 */
export class ParseCommitsDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiPropertyOptional({ description: '', example: 'v1.0.0' })
  @IsOptional()
  @IsString()
  from?: string

  @ApiPropertyOptional({ description: '', example: 'HEAD' })
  @IsOptional()
  @IsString()
  to?: string
}

/**
 * API Operation
 */
export class GetVersionChangelogDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiProperty({ description: '', example: '1.0.0' })
  @IsString()
  version!: string
}
