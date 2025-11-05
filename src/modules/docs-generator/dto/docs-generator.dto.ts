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
export enum DocFormat {
  MARKDOWN = 'markdown',
  HTML = 'html',
  PDF = 'pdf',
  DOCX = 'docx',
  JSON = 'json',
  YAML = 'yaml',
}

// Operation
export enum DocType {
  API = 'api',
  README = 'readme',
  CHANGELOG = 'changelog',
  COMPONENT = 'component',
  GUIDE = 'guide',
  REFERENCE = 'reference',
  TUTORIAL = 'tutorial',
}

// Operation
export class GenerateDocsDto {
  @ApiProperty({ description: 'Project path to generate docs from' })
  @IsString()
  path: string

  @ApiProperty({ 
    enum: DocType,
    description: 'Type of documentation to generate' 
  })
  @IsEnum(DocType)
  type: DocType

  @ApiPropertyOptional({ 
    enum: DocFormat,
    description: 'Output format',
    default: DocFormat.MARKDOWN
  })
  @IsOptional()
  @IsEnum(DocFormat)
  format?: DocFormat

  @ApiPropertyOptional({ description: 'Output directory for generated docs' })
  @IsOptional()
  @IsString()
  output?: string

  @ApiPropertyOptional({ description: 'Include source code examples' })
  @IsOptional()
  @IsBoolean()
  includeExamples?: boolean

  @ApiPropertyOptional({ description: 'Include type definitions' })
  @IsOptional()
  @IsBoolean()
  includeTypes?: boolean

  @ApiPropertyOptional({ description: 'Custom template path' })
  @IsOptional()
  @IsString()
  template?: string
}

// Operation
export class GenerateApiDocsDto {
  @ApiProperty({ description: 'Source code path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'API specification format' })
  @IsOptional()
  @IsEnum(['openapi', 'swagger', 'graphql', 'asyncapi'])
  spec?: string

  @ApiPropertyOptional({ description: 'API version' })
  @IsOptional()
  @IsString()
  version?: string

  @ApiPropertyOptional({ description: 'Base URL for API' })
  @IsOptional()
  @IsString()
  baseUrl?: string

  @ApiPropertyOptional({ description: 'Include request/response examples' })
  @IsOptional()
  @IsBoolean()
  includeExamples?: boolean

  @ApiPropertyOptional({ description: 'Group endpoints by tags' })
  @IsOptional()
  @IsBoolean()
  groupByTags?: boolean
}

// Operation
export class GenerateReadmeDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Sections to include' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sections?: string[]

  @ApiPropertyOptional({ description: 'Include badges' })
  @IsOptional()
  @IsBoolean()
  badges?: boolean

  @ApiPropertyOptional({ description: 'Include table of contents' })
  @IsOptional()
  @IsBoolean()
  toc?: boolean

  @ApiPropertyOptional({ description: 'Include license info' })
  @IsOptional()
  @IsBoolean()
  license?: boolean

  @ApiPropertyOptional({ description: 'Include contribution guidelines' })
  @IsOptional()
  @IsBoolean()
  contributing?: boolean
}

// Operation
export class GenerateComponentDocsDto {
  @ApiProperty({ description: 'Components directory path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Framework type' })
  @IsOptional()
  @IsEnum(['react', 'vue', 'angular', 'svelte', 'web-components'])
  framework?: string

  @ApiPropertyOptional({ description: 'Include props documentation' })
  @IsOptional()
  @IsBoolean()
  props?: boolean

  @ApiPropertyOptional({ description: 'Include events documentation' })
  @IsOptional()
  @IsBoolean()
  events?: boolean

  @ApiPropertyOptional({ description: 'Include slots documentation' })
  @IsOptional()
  @IsBoolean()
  slots?: boolean

  @ApiPropertyOptional({ description: 'Include usage examples' })
  @IsOptional()
  @IsBoolean()
  examples?: boolean

  @ApiPropertyOptional({ description: 'Generate Storybook stories' })
  @IsOptional()
  @IsBoolean()
  storybook?: boolean
}

// Operation
export class ServeDocsDto {
  @ApiProperty({ description: 'Documentation directory path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Port to serve docs on' })
  @IsOptional()
  @IsString()
  port?: string

  @ApiPropertyOptional({ description: 'Enable hot reload' })
  @IsOptional()
  @IsBoolean()
  watch?: boolean

  @ApiPropertyOptional({ description: 'Open in browser' })
  @IsOptional()
  @IsBoolean()
  open?: boolean
}

// Operation
export class ValidateDocsDto {
  @ApiProperty({ description: 'Documentation path to validate' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Check for broken links' })
  @IsOptional()
  @IsBoolean()
  checkLinks?: boolean

  @ApiPropertyOptional({ description: 'Check code examples' })
  @IsOptional()
  @IsBoolean()
  checkExamples?: boolean

  @ApiPropertyOptional({ description: 'Check spelling' })
  @IsOptional()
  @IsBoolean()
  checkSpelling?: boolean

  @ApiPropertyOptional({ description: 'Custom validation rules' })
  @IsOptional()
  @IsArray()
  rules?: any[]
}

// Operation
export class ConfigureSearchDto {
  @ApiProperty({ description: 'Documentation path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Search provider' })
  @IsOptional()
  @IsEnum(['algolia', 'elasticsearch', 'local'])
  provider?: string

  @ApiPropertyOptional({ description: 'Index name' })
  @IsOptional()
  @IsString()
  indexName?: string

  @ApiPropertyOptional({ description: 'API key' })
  @IsOptional()
  @IsString()
  apiKey?: string
}

// Operation
export class DeployDocsDto {
  @ApiProperty({ description: 'Documentation build path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Deployment platform' })
  @IsOptional()
  @IsEnum(['github-pages', 'netlify', 'vercel', 'gitlab-pages', 's3'])
  platform?: string

  @ApiPropertyOptional({ description: 'Custom domain' })
  @IsOptional()
  @IsString()
  domain?: string

  @ApiPropertyOptional({ description: 'Base path for deployment' })
  @IsOptional()
  @IsString()
  basePath?: string
}