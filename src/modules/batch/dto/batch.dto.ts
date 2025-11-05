import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsString, IsNotEmpty, IsOptional, IsEnum, ValidateNested, IsObject } from 'class-validator'
import { Type } from 'class-transformer'

export enum BatchOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  IMPORT = 'import',
  EXPORT = 'export',
  PROCESS = 'process',
}

export enum BatchModule {
  PROJECT = 'project',
  BUILD = 'build',
  TEST = 'test',
  DEPLOY = 'deploy',
  FILE = 'file',
  JOB = 'job',
  WORKFLOW = 'workflow',
  NOTIFICATION = 'notification',
}

// Operation
export class BatchOperationItem {
  @ApiProperty({ description: 'ID' })
  @IsString()
  @IsNotEmpty()
  id: string

  @ApiProperty({ description: '' })
  @IsObject()
  @IsNotEmpty()
  data: any
}

// Operation
export class BatchCreateDto {
  @ApiProperty({ description: '', enum: BatchModule })
  @IsEnum(BatchModule)
  @IsNotEmpty()
  module: BatchModule

  @ApiProperty({ description: '', type: [BatchOperationItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchOperationItem)
  items: BatchOperationItem[]

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  options?: {
    stopOnError?: boolean
    parallel?: boolean
    batchSize?: number
  }
}

// Operation
export class BatchUpdateDto {
  @ApiProperty({ description: '', enum: BatchModule })
  @IsEnum(BatchModule)
  @IsNotEmpty()
  module: BatchModule

  @ApiProperty({ description: 'ID' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids: string[]

  @ApiProperty({ description: '' })
  @IsObject()
  @IsNotEmpty()
  data: any

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  options?: {
    stopOnError?: boolean
  }
}

// Operation
export class BatchDeleteDto {
  @ApiProperty({ description: '', enum: BatchModule })
  @IsEnum(BatchModule)
  @IsNotEmpty()
  module: BatchModule

  @ApiProperty({ description: 'ID' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids: string[]

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  options?: {
    force?: boolean
    stopOnError?: boolean
  }
}

// Operation
export class BatchImportDto {
  @ApiProperty({ description: '', enum: BatchModule })
  @IsEnum(BatchModule)
  @IsNotEmpty()
  module: BatchModule

  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  format: 'json' | 'csv' | 'yaml' | 'xml'

  @ApiProperty({ description: '' })
  @IsNotEmpty()
  data: any

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  options?: {
    skipErrors?: boolean
    updateExisting?: boolean
    mapping?: Record<string, string>
  }
}

// Operation
export class BatchExportDto {
  @ApiProperty({ description: '', enum: BatchModule })
  @IsEnum(BatchModule)
  @IsNotEmpty()
  module: BatchModule

  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  format: 'json' | 'csv' | 'yaml' | 'xml' | 'excel'

  @ApiProperty({ description: 'ID', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ids?: string[]

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  filter?: any

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  options?: {
    includeRelations?: boolean
    fields?: string[]
  }
}

// Operation
export class BatchProcessDto {
  @ApiProperty({ description: '', enum: BatchModule })
  @IsEnum(BatchModule)
  @IsNotEmpty()
  module: BatchModule

  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  action: string

  @ApiProperty({ description: 'ID' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  ids: string[]

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  params?: any

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  options?: {
    stopOnError?: boolean
    parallel?: boolean
    batchSize?: number
  }
}

// Operation
export class BatchStatusDto {
  @ApiProperty({ description: 'ID' })
  @IsString()
  @IsNotEmpty()
  batchId: string
}

// Operation
export interface BatchResult {
  batchId: string
  total: number
  successful: number
  failed: number
  results: Array<{
    id: string
    status: 'success' | 'error'
    data?: any
    error?: string
  }>
  duration: number
  startTime: Date
  endTime: Date
}
