import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  IsNumber,
} from 'class-validator'

// Operation
export enum LanguageCode {
  EN = 'en',
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  JA = 'ja',
  KO = 'ko',
  RU = 'ru',
  AR = 'ar',
  PT = 'pt',
  IT = 'it',
  NL = 'nl',
  PL = 'pl',
  TR = 'tr',
}

// Operation
export enum TranslationProvider {
  GOOGLE = 'google',
  DEEPL = 'deepl',
  AZURE = 'azure',
  AWS = 'aws',
  BAIDU = 'baidu',
  YOUDAO = 'youdao',
  OPENAI = 'openai',
}

// Operation
export enum FileType {
  JSON = 'json',
  YAML = 'yaml',
  PO = 'po',
  PROPERTIES = 'properties',
  XML = 'xml',
  RESX = 'resx',
  STRINGS = 'strings',
}

// Operation
export class TranslateTextDto {
  @ApiProperty({ description: 'Text to translate' })
  @IsString()
  text: string

  @ApiProperty({ 
    enum: LanguageCode,
    description: 'Source language' 
  })
  @IsEnum(LanguageCode)
  sourceLang: LanguageCode

  @ApiProperty({ 
    enum: LanguageCode,
    description: 'Target language' 
  })
  @IsEnum(LanguageCode)
  targetLang: LanguageCode

  @ApiPropertyOptional({ 
    enum: TranslationProvider,
    description: 'Translation provider' 
  })
  @IsOptional()
  @IsEnum(TranslationProvider)
  provider?: TranslationProvider

  @ApiPropertyOptional({ description: 'Context for better translation' })
  @IsOptional()
  @IsString()
  context?: string

  @ApiPropertyOptional({ description: 'Preserve formatting' })
  @IsOptional()
  @IsBoolean()
  preserveFormatting?: boolean
}

// Operation
export class TranslateFileDto {
  @ApiProperty({ description: 'File path to translate' })
  @IsString()
  filePath: string

  @ApiProperty({ 
    enum: LanguageCode,
    description: 'Source language' 
  })
  @IsEnum(LanguageCode)
  sourceLang: LanguageCode

  @ApiProperty({ 
    enum: LanguageCode,
    description: 'Target language' 
  })
  @IsEnum(LanguageCode)
  targetLang: LanguageCode

  @ApiPropertyOptional({ 
    enum: FileType,
    description: 'File type' 
  })
  @IsOptional()
  @IsEnum(FileType)
  fileType?: FileType

  @ApiPropertyOptional({ description: 'Output file path' })
  @IsOptional()
  @IsString()
  outputPath?: string

  @ApiPropertyOptional({ description: 'Keys to exclude from translation' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeKeys?: string[]

  @ApiPropertyOptional({ description: 'Overwrite existing file' })
  @IsOptional()
  @IsBoolean()
  overwrite?: boolean
}

// Operation
export class BatchTranslateDto {
  @ApiProperty({ description: 'Items to translate' })
  @IsArray()
  items: Array<{
    text: string
    key?: string
  }>

  @ApiProperty({ 
    enum: LanguageCode,
    description: 'Source language' 
  })
  @IsEnum(LanguageCode)
  sourceLang: LanguageCode

  @ApiProperty({ description: 'Target languages' })
  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  targetLangs: LanguageCode[]

  @ApiPropertyOptional({ description: 'Batch size' })
  @IsOptional()
  @IsNumber()
  batchSize?: number

  @ApiPropertyOptional({ description: 'Parallel translation' })
  @IsOptional()
  @IsBoolean()
  parallel?: boolean
}

// Operation
export class DetectLanguageDto {
  @ApiProperty({ description: 'Text to detect language' })
  @IsString()
  text: string

  @ApiPropertyOptional({ description: 'Return confidence score' })
  @IsOptional()
  @IsBoolean()
  includeConfidence?: boolean

  @ApiPropertyOptional({ description: 'Return alternatives' })
  @IsOptional()
  @IsBoolean()
  includeAlternatives?: boolean
}

// Operation
export class ManageTranslationKeysDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  projectPath: string

  @ApiProperty({ description: 'Action to perform' })
  @IsEnum(['add', 'remove', 'update', 'list', 'validate'])
  action: string

  @ApiPropertyOptional({ description: 'Translation key' })
  @IsOptional()
  @IsString()
  key?: string

  @ApiPropertyOptional({ description: 'Translations for the key' })
  @IsOptional()
  @IsObject()
  translations?: Record<string, string>

  @ApiPropertyOptional({ description: 'Description or context' })
  @IsOptional()
  @IsString()
  description?: string
}

// Operation
export class SyncTranslationsDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  projectPath: string

  @ApiProperty({ description: 'Base language' })
  @IsEnum(LanguageCode)
  baseLang: LanguageCode

  @ApiPropertyOptional({ description: 'Languages to sync' })
  @IsOptional()
  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  targetLangs?: LanguageCode[]

  @ApiPropertyOptional({ description: 'Auto-translate missing keys' })
  @IsOptional()
  @IsBoolean()
  autoTranslate?: boolean

  @ApiPropertyOptional({ description: 'Remove obsolete keys' })
  @IsOptional()
  @IsBoolean()
  removeObsolete?: boolean
}

// Operation
export class ValidateTranslationsDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  projectPath: string

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  @IsArray()
  rules?: Array<{
    type: string
    severity: string
  }>

  @ApiPropertyOptional({ description: 'Check for missing keys' })
  @IsOptional()
  @IsBoolean()
  checkMissing?: boolean

  @ApiPropertyOptional({ description: 'Check for unused keys' })
  @IsOptional()
  @IsBoolean()
  checkUnused?: boolean

  @ApiPropertyOptional({ description: 'Check formatting' })
  @IsOptional()
  @IsBoolean()
  checkFormatting?: boolean
}

// Operation
export class ExportTranslationsDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  projectPath: string

  @ApiProperty({ description: 'Export format' })
  @IsEnum(FileType)
  format: FileType

  @ApiPropertyOptional({ description: 'Languages to export' })
  @IsOptional()
  @IsArray()
  @IsEnum(LanguageCode, { each: true })
  languages?: LanguageCode[]

  @ApiPropertyOptional({ description: 'Output directory' })
  @IsOptional()
  @IsString()
  outputDir?: string

  @ApiPropertyOptional({ description: 'Include metadata' })
  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean
}

// Operation
export class GetTranslationStatsDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  projectPath: string

  @ApiPropertyOptional({ description: 'Group by language' })
  @IsOptional()
  @IsBoolean()
  byLanguage?: boolean

  @ApiPropertyOptional({ description: 'Include coverage' })
  @IsOptional()
  @IsBoolean()
  includeCoverage?: boolean
}