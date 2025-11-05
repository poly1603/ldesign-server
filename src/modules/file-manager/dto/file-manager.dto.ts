import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator'

// Operation
export enum FileOperation {
  COPY = 'copy',
  MOVE = 'move',
  DELETE = 'delete',
  RENAME = 'rename',
  COMPRESS = 'compress',
  EXTRACT = 'extract',
}

// Operation
export enum FileType {
  FILE = 'file',
  DIRECTORY = 'directory',
  SYMLINK = 'symlink',
}

// Operation
export enum CompressionFormat {
  ZIP = 'zip',
  TAR = 'tar',
  GZ = 'gz',
  TAR_GZ = 'tar.gz',
  RAR = 'rar',
  SEVEN_Z = '7z',
}

// Operation
export class UploadFileDto {
  @ApiProperty({ description: 'Target directory path' })
  @IsString()
  targetPath: string

  @ApiPropertyOptional({ description: 'Overwrite existing file' })
  @IsOptional()
  @IsBoolean()
  overwrite?: boolean

  @ApiPropertyOptional({ description: 'Create directory if not exists' })
  @IsOptional()
  @IsBoolean()
  createDirectory?: boolean
}

// Operation
export class ChunkUploadDto {
  @ApiProperty({ description: 'Upload session ID' })
  @IsString()
  sessionId: string

  @ApiProperty({ description: 'Chunk index' })
  @IsNumber()
  @Min(0)
  chunkIndex: number

  @ApiProperty({ description: 'Total chunks' })
  @IsNumber()
  @Min(1)
  totalChunks: number

  @ApiProperty({ description: 'File name' })
  @IsString()
  fileName: string

  @ApiPropertyOptional({ description: 'File hash' })
  @IsOptional()
  @IsString()
  fileHash?: string
}

// Operation
export class ListFilesDto {
  @ApiProperty({ description: 'Directory path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Include hidden files' })
  @IsOptional()
  @IsBoolean()
  includeHidden?: boolean

  @ApiPropertyOptional({ description: 'Recursive listing' })
  @IsOptional()
  @IsBoolean()
  recursive?: boolean

  @ApiPropertyOptional({ description: 'File type filter' })
  @IsOptional()
  @IsEnum(FileType)
  type?: FileType

  @ApiPropertyOptional({ description: 'File extension filter' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  extensions?: string[]

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsEnum(['name', 'size', 'modified', 'created'])
  sortBy?: string

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc'
}

// Operation
export class SearchFilesDto {
  @ApiProperty({ description: 'Search path' })
  @IsString()
  path: string

  @ApiProperty({ description: 'Search pattern' })
  @IsString()
  pattern: string

  @ApiPropertyOptional({ description: 'Use regex' })
  @IsOptional()
  @IsBoolean()
  useRegex?: boolean

  @ApiPropertyOptional({ description: 'Case sensitive' })
  @IsOptional()
  @IsBoolean()
  caseSensitive?: boolean

  @ApiPropertyOptional({ description: 'Search in content' })
  @IsOptional()
  @IsBoolean()
  searchContent?: boolean

  @ApiPropertyOptional({ description: 'Maximum results' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxResults?: number
}

// Operation
export class FileOperationDto {
  @ApiProperty({ description: 'Source path' })
  @IsString()
  sourcePath: string

  @ApiProperty({ description: 'Destination path' })
  @IsString()
  destinationPath: string

  @ApiProperty({ 
    enum: FileOperation,
    description: 'Operation type' 
  })
  @IsEnum(FileOperation)
  operation: FileOperation

  @ApiPropertyOptional({ description: 'Overwrite existing' })
  @IsOptional()
  @IsBoolean()
  overwrite?: boolean

  @ApiPropertyOptional({ description: 'Create parent directories' })
  @IsOptional()
  @IsBoolean()
  createParents?: boolean
}

// Operation
export class BatchOperationDto {
  @ApiProperty({ description: 'File paths' })
  @IsArray()
  @IsString({ each: true })
  paths: string[]

  @ApiProperty({ 
    enum: FileOperation,
    description: 'Operation type' 
  })
  @IsEnum(FileOperation)
  operation: FileOperation

  @ApiPropertyOptional({ description: 'Target directory (for copy/move)' })
  @IsOptional()
  @IsString()
  targetDirectory?: string

  @ApiPropertyOptional({ description: 'Stop on error' })
  @IsOptional()
  @IsBoolean()
  stopOnError?: boolean
}

// Operation
export class CompressFilesDto {
  @ApiProperty({ description: 'Files to compress' })
  @IsArray()
  @IsString({ each: true })
  files: string[]

  @ApiProperty({ description: 'Output file path' })
  @IsString()
  outputPath: string

  @ApiProperty({ 
    enum: CompressionFormat,
    description: 'Compression format' 
  })
  @IsEnum(CompressionFormat)
  format: CompressionFormat

  @ApiPropertyOptional({ description: 'Compression level (1-9)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(9)
  compressionLevel?: number

  @ApiPropertyOptional({ description: 'Include base directory' })
  @IsOptional()
  @IsBoolean()
  includeBaseDir?: boolean

  @ApiPropertyOptional({ description: 'Archive password' })
  @IsOptional()
  @IsString()
  password?: string
}

// Operation
export class ExtractFilesDto {
  @ApiProperty({ description: 'Archive file path' })
  @IsString()
  archivePath: string

  @ApiProperty({ description: 'Output directory' })
  @IsString()
  outputDirectory: string

  @ApiPropertyOptional({ description: 'Overwrite existing files' })
  @IsOptional()
  @IsBoolean()
  overwrite?: boolean

  @ApiPropertyOptional({ description: 'Create output directory' })
  @IsOptional()
  @IsBoolean()
  createDirectory?: boolean

  @ApiPropertyOptional({ description: 'Archive password' })
  @IsOptional()
  @IsString()
  password?: string

  @ApiPropertyOptional({ description: 'Files to extract' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specificFiles?: string[]
}

// Operation
export class CreateDirectoryDto {
  @ApiProperty({ description: 'Directory path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Create parent directories' })
  @IsOptional()
  @IsBoolean()
  recursive?: boolean

  @ApiPropertyOptional({ description: 'Directory permissions' })
  @IsOptional()
  @IsString()
  permissions?: string
}

// Operation
export class GetFileInfoDto {
  @ApiProperty({ description: 'File path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Include checksum' })
  @IsOptional()
  @IsBoolean()
  includeChecksum?: boolean

  @ApiPropertyOptional({ description: 'Include metadata' })
  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean
}

// Operation
export class ChangePermissionsDto {
  @ApiProperty({ description: 'File path' })
  @IsString()
  path: string

  @ApiProperty({ description: 'Permissions (e.g., 755)' })
  @IsString()
  permissions: string

  @ApiPropertyOptional({ description: 'Apply recursively' })
  @IsOptional()
  @IsBoolean()
  recursive?: boolean
}