import { IsString, IsOptional, IsBoolean, IsEnum, IsArray } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * API Operation
 */
export enum ScanType {
  FULL = 'full',
  QUICK = 'quick',
  DEPENDENCIES = 'dependencies',
  CODE = 'code',
  SECRETS = 'secrets',
  LICENSES = 'licenses',
}

/**
 * API Operation
 */
export enum Severity {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * API Operation
 */
export class SecurityScanDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiPropertyOptional({
    description: '',
    enum: ScanType,
    example: ScanType.FULL,
  })
  @IsOptional()
  @IsEnum(ScanType)
  type?: ScanType

  @ApiPropertyOptional({ description: '', example: true })
  @IsOptional()
  @IsBoolean()
  deep?: boolean

  @ApiPropertyOptional({
    description: '',
    example: ['node_modules', 'dist'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ignore?: string[]
}

/**
 * API Operation
 */
export class SecurityAuditDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiPropertyOptional({ description: '', example: true })
  @IsOptional()
  @IsBoolean()
  includeDev?: boolean

  @ApiPropertyOptional({ description: '', example: false })
  @IsOptional()
  @IsBoolean()
  autoFix?: boolean
}

/**
 * API Operation
 */
export class FixVulnerabilityDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiProperty({ description: 'ID', example: 'CVE-2024-1234' })
  @IsString()
  vulnerabilityId!: string

  @ApiPropertyOptional({ description: '', example: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean
}

/**
 * API Operation
 */
export class CodeCheckDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiPropertyOptional({
    description: '',
    example: ['no-eval', 'no-dangerouslySetInnerHTML'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rules?: string[]

  @ApiPropertyOptional({
    description: '',
    example: ['.js', '.ts', '.jsx', '.tsx'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extensions?: string[]
}

/**
 * API Operation
 */
export class SecretScanDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiPropertyOptional({ description: '', example: false })
  @IsOptional()
  @IsBoolean()
  scanHistory?: boolean

  @ApiPropertyOptional({
    description: '',
    example: ['API_KEY=', 'SECRET_KEY='],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  patterns?: string[]
}

/**
 * API Operation
 */
export class LicenseCheckDto {
  @ApiProperty({ description: '', example: 'D:\\projects\\my-project' })
  @IsString()
  path!: string

  @ApiPropertyOptional({
    description: '',
    example: ['MIT', 'Apache-2.0', 'BSD-3-Clause'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed?: string[]

  @ApiPropertyOptional({
    description: '',
    example: ['GPL-3.0', 'AGPL-3.0'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  forbidden?: string[]
}