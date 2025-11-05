import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator'

// Operation
export enum BackupFormat {
  SQL = 'sql',
  SQLITE = 'sqlite',
  JSON = 'json',
}

// Operation
export enum QueryType {
  SELECT = 'select',
  INSERT = 'insert',
  UPDATE = 'update',
  DELETE = 'delete',
  CREATE = 'create',
  DROP = 'drop',
  ALTER = 'alter',
}

// Operation
export class CreateBackupDto {
  @ApiPropertyOptional({ description: 'Backup name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Backup description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ enum: BackupFormat, description: 'Backup format' })
  @IsEnum(BackupFormat)
  format: BackupFormat

  @ApiPropertyOptional({ description: 'Compress backup' })
  @IsOptional()
  @IsBoolean()
  compress?: boolean

  @ApiPropertyOptional({ description: 'Include schema' })
  @IsOptional()
  @IsBoolean()
  includeSchema?: boolean

  @ApiPropertyOptional({ description: 'Include data' })
  @IsOptional()
  @IsBoolean()
  includeData?: boolean
}

// Operation
export class RestoreBackupDto {
  @ApiProperty({ description: 'Backup file path or ID' })
  @IsString()
  backup: string

  @ApiPropertyOptional({ description: 'Drop existing tables' })
  @IsOptional()
  @IsBoolean()
  dropExisting?: boolean

  @ApiPropertyOptional({ description: 'Dry run (test only)' })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean
}

// Operation
export class ExecuteQueryDto {
  @ApiProperty({ description: 'SQL query' })
  @IsString()
  query: string

  @ApiPropertyOptional({ description: 'Query parameters' })
  @IsOptional()
  params?: any[]

  @ApiPropertyOptional({ description: 'Read only (SELECT only)' })
  @IsOptional()
  @IsBoolean()
  readOnly?: boolean

  @ApiPropertyOptional({ description: 'Return raw results' })
  @IsOptional()
  @IsBoolean()
  raw?: boolean
}

// Operation
export class GetTableInfoDto {
  @ApiProperty({ description: 'Table name' })
  @IsString()
  tableName: string

  @ApiPropertyOptional({ description: 'Include row count' })
  @IsOptional()
  @IsBoolean()
  includeCount?: boolean

  @ApiPropertyOptional({ description: 'Include indexes' })
  @IsOptional()
  @IsBoolean()
  includeIndexes?: boolean
}

// Operation
export class OptimizeDatabaseDto {
  @ApiPropertyOptional({ description: 'Vacuum database' })
  @IsOptional()
  @IsBoolean()
  vacuum?: boolean

  @ApiPropertyOptional({ description: 'Analyze statistics' })
  @IsOptional()
  @IsBoolean()
  analyze?: boolean

  @ApiPropertyOptional({ description: 'Reindex all tables' })
  @IsOptional()
  @IsBoolean()
  reindex?: boolean

  @ApiPropertyOptional({ description: 'Check integrity' })
  @IsOptional()
  @IsBoolean()
  checkIntegrity?: boolean
}

// Operation
export class ExportDataDto {
  @ApiPropertyOptional({ description: 'Table name (empty for all)' })
  @IsOptional()
  @IsString()
  tableName?: string

  @ApiProperty({ enum: ['json', 'csv', 'sql'], description: 'Export format' })
  @IsEnum(['json', 'csv', 'sql'])
  format: string

  @ApiPropertyOptional({ description: 'Output file path' })
  @IsOptional()
  @IsString()
  outputPath?: string

  @ApiPropertyOptional({ description: 'Include column headers (CSV)' })
  @IsOptional()
  @IsBoolean()
  includeHeaders?: boolean
}

// Operation
export class ImportDataDto {
  @ApiProperty({ description: 'Import file path' })
  @IsString()
  filePath: string

  @ApiProperty({ description: 'Target table name' })
  @IsString()
  tableName: string

  @ApiProperty({ enum: ['json', 'csv', 'sql'], description: 'Import format' })
  @IsEnum(['json', 'csv', 'sql'])
  format: string

  @ApiPropertyOptional({ description: 'Truncate before import' })
  @IsOptional()
  @IsBoolean()
  truncate?: boolean

  @ApiPropertyOptional({ description: 'Skip on error' })
  @IsOptional()
  @IsBoolean()
  skipOnError?: boolean
}

// Operation
export class CleanupDataDto {
  @ApiPropertyOptional({ description: 'Table name (empty for all)' })
  @IsOptional()
  @IsString()
  tableName?: string

  @ApiPropertyOptional({ description: 'Delete old data (days)' })
  @IsOptional()
  days?: number

  @ApiPropertyOptional({ description: 'Truncate table' })
  @IsOptional()
  @IsBoolean()
  truncate?: boolean

  @ApiPropertyOptional({ description: 'Delete orphaned records' })
  @IsOptional()
  @IsBoolean()
  deleteOrphaned?: boolean
}
