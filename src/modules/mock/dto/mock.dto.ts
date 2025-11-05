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
export enum MockDataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object',
  EMAIL = 'email',
  URL = 'url',
  UUID = 'uuid',
  IMAGE = 'image',
  PARAGRAPH = 'paragraph',
  NAME = 'name',
  ADDRESS = 'address',
  PHONE = 'phone',
}

// Operation
export enum MockServerType {
  REST = 'rest',
  GRAPHQL = 'graphql',
  WEBSOCKET = 'websocket',
  GRPC = 'grpc',
}

// Operation
export class GenerateMockDataDto {
  @ApiProperty({ description: 'Schema or template for mock data' })
  @IsObject()
  schema: any

  @ApiPropertyOptional({ description: 'Number of records to generate' })
  @IsOptional()
  @IsNumber()
  count?: number

  @ApiPropertyOptional({ description: 'Output format' })
  @IsOptional()
  @IsEnum(['json', 'csv', 'xml', 'yaml', 'sql'])
  format?: string

  @ApiPropertyOptional({ description: 'Locale for generated data' })
  @IsOptional()
  @IsEnum(['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko'])
  locale?: string

  @ApiPropertyOptional({ description: 'Seed for consistent generation' })
  @IsOptional()
  @IsNumber()
  seed?: number
}

// Operation
export class CreateMockApiDto {
  @ApiProperty({ description: 'API endpoint path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'HTTP method' })
  @IsOptional()
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'])
  method?: string

  @ApiProperty({ description: 'Response schema' })
  @IsObject()
  responseSchema: any

  @ApiPropertyOptional({ description: 'Response status code' })
  @IsOptional()
  @IsNumber()
  statusCode?: number

  @ApiPropertyOptional({ description: 'Response delay in milliseconds' })
  @IsOptional()
  @IsNumber()
  delay?: number

  @ApiPropertyOptional({ description: 'Request validation schema' })
  @IsOptional()
  @IsObject()
  requestSchema?: any

  @ApiPropertyOptional({ description: 'Custom headers' })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>
}

// Operation
export class StartMockServerDto {
  @ApiProperty({ description: 'Server configuration' })
  @IsObject()
  config: {
    port?: number
    host?: string
    routes?: any[]
  }

  @ApiPropertyOptional({ 
    enum: MockServerType,
    description: 'Server type' 
  })
  @IsOptional()
  @IsEnum(MockServerType)
  type?: MockServerType

  @ApiPropertyOptional({ description: 'Enable CORS' })
  @IsOptional()
  @IsBoolean()
  cors?: boolean

  @ApiPropertyOptional({ description: 'Enable logging' })
  @IsOptional()
  @IsBoolean()
  logging?: boolean

  @ApiPropertyOptional({ description: 'Static files directory' })
  @IsOptional()
  @IsString()
  static?: string

  @ApiPropertyOptional({ description: 'Proxy configuration' })
  @IsOptional()
  @IsObject()
  proxy?: any
}

// Operation
export class GenerateMockDatabaseDto {
  @ApiProperty({ description: 'Database schema' })
  @IsObject()
  schema: {
    tables: Array<{
      name: string
      columns: any[]
      records?: number
    }>
  }

  @ApiPropertyOptional({ description: 'Database type' })
  @IsOptional()
  @IsEnum(['mysql', 'postgresql', 'mongodb', 'sqlite', 'redis'])
  type?: string

  @ApiPropertyOptional({ description: 'Generate relations' })
  @IsOptional()
  @IsBoolean()
  withRelations?: boolean

  @ApiPropertyOptional({ description: 'Output file path' })
  @IsOptional()
  @IsString()
  outputFile?: string

  @ApiPropertyOptional({ description: 'Generate seed script' })
  @IsOptional()
  @IsBoolean()
  seedScript?: boolean
}

// Operation
export class MockFileUploadDto {
  @ApiProperty({ description: 'File type to mock' })
  @IsEnum(['image', 'pdf', 'csv', 'excel', 'word', 'video', 'audio'])
  fileType: string

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsNumber()
  size?: number

  @ApiPropertyOptional({ description: 'File name' })
  @IsOptional()
  @IsString()
  fileName?: string

  @ApiPropertyOptional({ description: 'Number of files' })
  @IsOptional()
  @IsNumber()
  count?: number

  @ApiPropertyOptional({ description: 'Custom metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any
}

// Operation
export class CreateMockWebSocketDto {
  @ApiProperty({ description: 'WebSocket endpoint' })
  @IsString()
  endpoint: string

  @ApiProperty({ description: 'Events configuration' })
  @IsArray()
  events: Array<{
    name: string
    data: any
    interval?: number
  }>

  @ApiPropertyOptional({ description: 'Port number' })
  @IsOptional()
  @IsNumber()
  port?: number

  @ApiPropertyOptional({ description: 'Authentication required' })
  @IsOptional()
  @IsBoolean()
  auth?: boolean

  @ApiPropertyOptional({ description: 'Broadcast to all clients' })
  @IsOptional()
  @IsBoolean()
  broadcast?: boolean
}

// Operation
export class GenerateTestDataDto {
  @ApiProperty({ description: 'Test scenario' })
  @IsString()
  scenario: string

  @ApiPropertyOptional({ description: 'Data variations' })
  @IsOptional()
  @IsArray()
  variations?: Array<{
    name: string
    probability: number
    data: any
  }>

  @ApiPropertyOptional({ description: 'Edge cases' })
  @IsOptional()
  @IsBoolean()
  includeEdgeCases?: boolean

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsOptional()
  @IsArray()
  validationRules?: any[]
}

// Operation
export class ImportExportMockDto {
  @ApiProperty({ description: 'File path' })
  @IsString()
  filePath: string

  @ApiPropertyOptional({ description: 'Action type' })
  @IsOptional()
  @IsEnum(['import', 'export'])
  action?: string

  @ApiPropertyOptional({ description: 'Configuration format' })
  @IsOptional()
  @IsEnum(['json', 'yaml', 'js'])
  format?: string

  @ApiPropertyOptional({ description: 'Include schemas' })
  @IsOptional()
  @IsBoolean()
  includeSchemas?: boolean
}

// Operation
export class ConfigureMockInterceptorDto {
  @ApiProperty({ description: 'Target URL or pattern' })
  @IsString()
  target: string

  @ApiPropertyOptional({ description: 'Intercept rules' })
  @IsOptional()
  @IsArray()
  rules?: Array<{
    pattern: string
    response: any
    condition?: any
  }>

  @ApiPropertyOptional({ description: 'Enable/disable interceptor' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @ApiPropertyOptional({ description: 'Log intercepted requests' })
  @IsOptional()
  @IsBoolean()
  logging?: boolean
}