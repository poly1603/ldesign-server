import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
} from 'class-validator'

// Operation
export enum EnvironmentType {
  DEVELOPMENT = 'development',
  TEST = 'test',
  STAGING = 'staging',
  PRODUCTION = 'production',
  LOCAL = 'local',
}

// Operation
export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  URL = 'url',
  PATH = 'path',
  SECRET = 'secret',
}

// Operation
export class GetEnvDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ 
    enum: EnvironmentType,
    description: 'Environment type' 
  })
  @IsOptional()
  @IsEnum(EnvironmentType)
  environment?: EnvironmentType

  @ApiPropertyOptional({ description: 'Variable name to get (if not provided, returns all)' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Decrypt secret values' })
  @IsOptional()
  @IsBoolean()
  decrypt?: boolean
}

// Operation
export class SetEnvDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiProperty({ description: 'Variable name' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Variable value' })
  value: any

  @ApiPropertyOptional({ 
    enum: EnvironmentType,
    description: 'Environment type' 
  })
  @IsOptional()
  @IsEnum(EnvironmentType)
  environment?: EnvironmentType

  @ApiPropertyOptional({ 
    enum: VariableType,
    description: 'Variable type' 
  })
  @IsOptional()
  @IsEnum(VariableType)
  type?: VariableType

  @ApiPropertyOptional({ description: 'Encrypt value if type is secret' })
  @IsOptional()
  @IsBoolean()
  encrypt?: boolean

  @ApiPropertyOptional({ description: 'Description of the variable' })
  @IsOptional()
  @IsString()
  description?: string
}

// Operation
export class DeleteEnvDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiProperty({ description: 'Variable name' })
  @IsString()
  name: string

  @ApiPropertyOptional({ 
    enum: EnvironmentType,
    description: 'Environment type' 
  })
  @IsOptional()
  @IsEnum(EnvironmentType)
  environment?: EnvironmentType
}

// Operation
export class ValidateEnvDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Schema file path or inline schema' })
  @IsOptional()
  schema?: any

  @ApiPropertyOptional({ 
    enum: EnvironmentType,
    description: 'Environment to validate' 
  })
  @IsOptional()
  @IsEnum(EnvironmentType)
  environment?: EnvironmentType

  @ApiPropertyOptional({ description: 'Check for required variables' })
  @IsOptional()
  @IsBoolean()
  checkRequired?: boolean

  @ApiPropertyOptional({ description: 'Check variable types' })
  @IsOptional()
  @IsBoolean()
  checkTypes?: boolean
}

// Operation
export class SyncEnvDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiProperty({ 
    enum: EnvironmentType,
    description: 'Source environment' 
  })
  @IsEnum(EnvironmentType)
  source: EnvironmentType

  @ApiProperty({ 
    enum: EnvironmentType,
    description: 'Target environment' 
  })
  @IsEnum(EnvironmentType)
  target: EnvironmentType

  @ApiPropertyOptional({ description: 'Variables to sync (if not provided, syncs all)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[]

  @ApiPropertyOptional({ description: 'Overwrite existing variables' })
  @IsOptional()
  @IsBoolean()
  overwrite?: boolean
}

// Operation
export class ImportEnvDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiProperty({ description: 'Source file path (.env, .json, .yaml)' })
  @IsString()
  sourceFile: string

  @ApiPropertyOptional({ 
    enum: EnvironmentType,
    description: 'Target environment' 
  })
  @IsOptional()
  @IsEnum(EnvironmentType)
  environment?: EnvironmentType

  @ApiPropertyOptional({ description: 'Merge with existing variables' })
  @IsOptional()
  @IsBoolean()
  merge?: boolean

  @ApiPropertyOptional({ description: 'Validate before import' })
  @IsOptional()
  @IsBoolean()
  validate?: boolean
}

// Operation
export class ExportEnvDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiProperty({ description: 'Output file path' })
  @IsString()
  outputFile: string

  @ApiPropertyOptional({ 
    enum: EnvironmentType,
    description: 'Environment to export' 
  })
  @IsOptional()
  @IsEnum(EnvironmentType)
  environment?: EnvironmentType

  @ApiPropertyOptional({ description: 'Output format' })
  @IsOptional()
  @IsEnum(['env', 'json', 'yaml', 'dotenv', 'shell'])
  format?: string

  @ApiPropertyOptional({ description: 'Include comments' })
  @IsOptional()
  @IsBoolean()
  includeComments?: boolean

  @ApiPropertyOptional({ description: 'Exclude secrets' })
  @IsOptional()
  @IsBoolean()
  excludeSecrets?: boolean
}

// Operation
export class GenerateEnvConfigDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Project type' })
  @IsOptional()
  @IsEnum(['node', 'react', 'vue', 'angular', 'next', 'nuxt', 'express', 'nestjs'])
  projectType?: string

  @ApiPropertyOptional({ description: 'Environments to generate' })
  @IsOptional()
  @IsArray()
  @IsEnum(EnvironmentType, { each: true })
  environments?: EnvironmentType[]

  @ApiPropertyOptional({ description: 'Include example values' })
  @IsOptional()
  @IsBoolean()
  includeExamples?: boolean

  @ApiPropertyOptional({ description: 'Template to use' })
  @IsOptional()
  @IsString()
  template?: string
}

// Operation
export class EncryptEnvDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Variables to encrypt (if not provided, encrypts all secrets)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[]

  @ApiPropertyOptional({ description: 'Encryption key (if not provided, uses default)' })
  @IsOptional()
  @IsString()
  key?: string

  @ApiPropertyOptional({ 
    enum: EnvironmentType,
    description: 'Environment to encrypt' 
  })
  @IsOptional()
  @IsEnum(EnvironmentType)
  environment?: EnvironmentType
}

// Operation
export class CompareEnvDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiProperty({ 
    enum: EnvironmentType,
    description: 'First environment' 
  })
  @IsEnum(EnvironmentType)
  env1: EnvironmentType

  @ApiProperty({ 
    enum: EnvironmentType,
    description: 'Second environment' 
  })
  @IsEnum(EnvironmentType)
  env2: EnvironmentType

  @ApiPropertyOptional({ description: 'Show only differences' })
  @IsOptional()
  @IsBoolean()
  diffOnly?: boolean
}