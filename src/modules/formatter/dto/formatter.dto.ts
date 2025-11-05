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
export enum FormatterTool {
  PRETTIER = 'prettier',
  ESLINT = 'eslint',
  STYLELINT = 'stylelint',
  BIOME = 'biome',
  DPRINT = 'dprint',
  BLACK = 'black',
  RUSTFMT = 'rustfmt',
  GOFMT = 'gofmt',
}

// Operation
export enum FileType {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  JSX = 'jsx',
  TSX = 'tsx',
  CSS = 'css',
  SCSS = 'scss',
  LESS = 'less',
  HTML = 'html',
  JSON = 'json',
  YAML = 'yaml',
  MARKDOWN = 'markdown',
  PYTHON = 'python',
  GO = 'go',
  RUST = 'rust',
}

// Operation
export class FormatFilesDto {
  @ApiProperty({ description: 'Project or file path to format' })
  @IsString()
  path: string

  @ApiPropertyOptional({ 
    enum: FormatterTool,
    description: 'Formatter tool to use' 
  })
  @IsOptional()
  @IsEnum(FormatterTool)
  tool?: FormatterTool

  @ApiPropertyOptional({ description: 'File patterns to format' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  patterns?: string[]

  @ApiPropertyOptional({ description: 'Configuration file path' })
  @IsOptional()
  @IsString()
  config?: string

  @ApiPropertyOptional({ description: 'Fix issues automatically' })
  @IsOptional()
  @IsBoolean()
  fix?: boolean

  @ApiPropertyOptional({ description: 'Write formatted output to files' })
  @IsOptional()
  @IsBoolean()
  write?: boolean

  @ApiPropertyOptional({ description: 'Ignore patterns' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ignore?: string[]
}

// Operation
export class CheckFormatDto {
  @ApiProperty({ description: 'Project or file path to check' })
  @IsString()
  path: string

  @ApiPropertyOptional({ 
    enum: FormatterTool,
    description: 'Formatter tool to use' 
  })
  @IsOptional()
  @IsEnum(FormatterTool)
  tool?: FormatterTool

  @ApiPropertyOptional({ description: 'File patterns to check' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  patterns?: string[]

  @ApiPropertyOptional({ description: 'Show detailed output' })
  @IsOptional()
  @IsBoolean()
  verbose?: boolean
}

// Operation
export class ConfigureFormatterDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiProperty({ 
    enum: FormatterTool,
    description: 'Formatter tool to configure' 
  })
  @IsEnum(FormatterTool)
  tool: FormatterTool

  @ApiPropertyOptional({ description: 'Configuration options' })
  @IsOptional()
  @IsObject()
  options?: any

  @ApiPropertyOptional({ description: 'Save configuration to file' })
  @IsOptional()
  @IsBoolean()
  save?: boolean

  @ApiPropertyOptional({ description: 'Configuration file name' })
  @IsOptional()
  @IsString()
  fileName?: string
}

// Operation
export class LintCodeDto {
  @ApiProperty({ description: 'Project or file path to lint' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Linter to use' })
  @IsOptional()
  @IsEnum(['eslint', 'tslint', 'pylint', 'golint', 'clippy'])
  linter?: string

  @ApiPropertyOptional({ description: 'Fix issues automatically' })
  @IsOptional()
  @IsBoolean()
  fix?: boolean

  @ApiPropertyOptional({ description: 'Configuration file' })
  @IsOptional()
  @IsString()
  config?: string

  @ApiPropertyOptional({ description: 'Report format' })
  @IsOptional()
  @IsEnum(['stylish', 'json', 'compact', 'junit', 'html'])
  format?: string
}

// Operation
export class SortImportsDto {
  @ApiProperty({ description: 'File or directory path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Sorting style' })
  @IsOptional()
  @IsEnum(['alphabetical', 'natural', 'line-length'])
  style?: string

  @ApiPropertyOptional({ description: 'Group imports by type' })
  @IsOptional()
  @IsBoolean()
  grouped?: boolean

  @ApiPropertyOptional({ description: 'Remove unused imports' })
  @IsOptional()
  @IsBoolean()
  removeUnused?: boolean
}

// Operation
export class OrganizeCodeDto {
  @ApiProperty({ description: 'File or directory path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Sort members' })
  @IsOptional()
  @IsBoolean()
  sortMembers?: boolean

  @ApiPropertyOptional({ description: 'Sort imports' })
  @IsOptional()
  @IsBoolean()
  sortImports?: boolean

  @ApiPropertyOptional({ description: 'Remove unused code' })
  @IsOptional()
  @IsBoolean()
  removeUnused?: boolean

  @ApiPropertyOptional({ description: 'Add missing imports' })
  @IsOptional()
  @IsBoolean()
  addMissingImports?: boolean
}

// Operation
export class BeautifyCodeDto {
  @ApiProperty({ description: 'Code content or file path' })
  @IsString()
  input: string

  @ApiProperty({ 
    enum: FileType,
    description: 'File type' 
  })
  @IsEnum(FileType)
  fileType: FileType

  @ApiPropertyOptional({ description: 'Indentation size' })
  @IsOptional()
  @IsNumber()
  indentSize?: number

  @ApiPropertyOptional({ description: 'Use tabs instead of spaces' })
  @IsOptional()
  @IsBoolean()
  useTabs?: boolean

  @ApiPropertyOptional({ description: 'Line width' })
  @IsOptional()
  @IsNumber()
  lineWidth?: number

  @ApiPropertyOptional({ description: 'Quote style' })
  @IsOptional()
  @IsEnum(['single', 'double'])
  quotes?: string
}

// Operation
export class MinifyCodeDto {
  @ApiProperty({ description: 'File or directory path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Output path' })
  @IsOptional()
  @IsString()
  output?: string

  @ApiPropertyOptional({ description: 'File types to minify' })
  @IsOptional()
  @IsArray()
  @IsEnum(FileType, { each: true })
  fileTypes?: FileType[]

  @ApiPropertyOptional({ description: 'Generate source maps' })
  @IsOptional()
  @IsBoolean()
  sourceMaps?: boolean

  @ApiPropertyOptional({ description: 'Keep comments' })
  @IsOptional()
  @IsBoolean()
  keepComments?: boolean
}

// Operation
export class GenerateEditorConfigDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Project type' })
  @IsOptional()
  @IsEnum(['node', 'react', 'vue', 'angular', 'python', 'go', 'rust'])
  projectType?: string

  @ApiPropertyOptional({ description: 'Custom rules' })
  @IsOptional()
  @IsObject()
  rules?: any
}