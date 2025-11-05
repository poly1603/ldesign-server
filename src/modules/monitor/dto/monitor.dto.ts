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
export enum MonitorType {
  APPLICATION = 'application',
  SYSTEM = 'system',
  NETWORK = 'network',
  DATABASE = 'database',
  API = 'api',
  CUSTOM = 'custom',
}

// Operation
export enum MetricType {
  CPU = 'cpu',
  MEMORY = 'memory',
  DISK = 'disk',
  NETWORK = 'network',
  REQUEST = 'request',
  ERROR = 'error',
  LATENCY = 'latency',
  THROUGHPUT = 'throughput',
}

// Operation
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Operation
export class StartMonitoringDto {
  @ApiProperty({ description: 'Application or service to monitor' })
  @IsString()
  target: string

  @ApiProperty({ 
    enum: MonitorType,
    description: 'Type of monitoring' 
  })
  @IsEnum(MonitorType)
  type: MonitorType

  @ApiPropertyOptional({ description: 'Metrics to collect' })
  @IsOptional()
  @IsArray()
  @IsEnum(MetricType, { each: true })
  metrics?: MetricType[]

  @ApiPropertyOptional({ description: 'Collection interval in seconds' })
  @IsOptional()
  @IsNumber()
  interval?: number

  @ApiPropertyOptional({ description: 'Enable real-time monitoring' })
  @IsOptional()
  @IsBoolean()
  realtime?: boolean

  @ApiPropertyOptional({ description: 'Alert configuration' })
  @IsOptional()
  @IsObject()
  alerts?: any
}

// Operation
export class GetMetricsDto {
  @ApiProperty({ description: 'Target to get metrics from' })
  @IsString()
  target: string

  @ApiPropertyOptional({ description: 'Time range' })
  @IsOptional()
  @IsObject()
  timeRange?: {
    start: string
    end: string
  }

  @ApiPropertyOptional({ description: 'Specific metrics to retrieve' })
  @IsOptional()
  @IsArray()
  @IsEnum(MetricType, { each: true })
  metrics?: MetricType[]

  @ApiPropertyOptional({ description: 'Aggregation method' })
  @IsOptional()
  @IsEnum(['avg', 'sum', 'min', 'max', 'count'])
  aggregation?: string

  @ApiPropertyOptional({ description: 'Group by field' })
  @IsOptional()
  @IsString()
  groupBy?: string
}

// Operation
export class SetAlertDto {
  @ApiProperty({ description: 'Alert name' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Target to monitor' })
  @IsString()
  target: string

  @ApiProperty({ description: 'Alert condition' })
  @IsObject()
  condition: {
    metric: MetricType
    operator: string
    threshold: number
  }

  @ApiProperty({ 
    enum: AlertLevel,
    description: 'Alert level' 
  })
  @IsEnum(AlertLevel)
  level: AlertLevel

  @ApiPropertyOptional({ description: 'Notification channels' })
  @IsOptional()
  @IsArray()
  channels?: string[]

  @ApiPropertyOptional({ description: 'Alert cooldown period in seconds' })
  @IsOptional()
  @IsNumber()
  cooldown?: number

  @ApiPropertyOptional({ description: 'Enable alert' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

// Operation
export class CreateDashboardDto {
  @ApiProperty({ description: 'Dashboard name' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: 'Dashboard description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ description: 'Dashboard widgets' })
  @IsArray()
  widgets: Array<{
    type: string
    title: string
    metric: MetricType
    target: string
    options?: any
  }>

  @ApiPropertyOptional({ description: 'Refresh interval in seconds' })
  @IsOptional()
  @IsNumber()
  refreshInterval?: number

  @ApiPropertyOptional({ description: 'Layout configuration' })
  @IsOptional()
  @IsObject()
  layout?: any
}

// Operation
export class GenerateReportDto {
  @ApiProperty({ description: 'Report type' })
  @IsEnum(['performance', 'availability', 'error', 'summary', 'custom'])
  type: string

  @ApiProperty({ description: 'Time period for report' })
  @IsObject()
  period: {
    start: string
    end: string
  }

  @ApiPropertyOptional({ description: 'Targets to include in report' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targets?: string[]

  @ApiPropertyOptional({ description: 'Report format' })
  @IsOptional()
  @IsEnum(['html', 'pdf', 'json', 'csv'])
  format?: string

  @ApiPropertyOptional({ description: 'Include charts' })
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean
}

// Operation
export class ConfigureLoggingDto {
  @ApiProperty({ description: 'Target application' })
  @IsString()
  target: string

  @ApiPropertyOptional({ description: 'Log level' })
  @IsOptional()
  @IsEnum(['debug', 'info', 'warn', 'error', 'fatal'])
  level?: string

  @ApiPropertyOptional({ description: 'Log output destinations' })
  @IsOptional()
  @IsArray()
  destinations?: Array<{
    type: string
    path?: string
    format?: string
  }>

  @ApiPropertyOptional({ description: 'Log rotation configuration' })
  @IsOptional()
  @IsObject()
  rotation?: {
    size?: string
    interval?: string
    maxFiles?: number
  }

  @ApiPropertyOptional({ description: 'Enable structured logging' })
  @IsOptional()
  @IsBoolean()
  structured?: boolean
}

// Operation
export class AnalyzePerformanceDto {
  @ApiProperty({ description: 'Target to analyze' })
  @IsString()
  target: string

  @ApiPropertyOptional({ description: 'Analysis type' })
  @IsOptional()
  @IsEnum(['profile', 'trace', 'benchmark', 'load'])
  analysisType?: string

  @ApiPropertyOptional({ description: 'Duration in seconds' })
  @IsOptional()
  @IsNumber()
  duration?: number

  @ApiPropertyOptional({ description: 'Include recommendations' })
  @IsOptional()
  @IsBoolean()
  recommendations?: boolean
}

// Operation
export class HealthCheckDto {
  @ApiProperty({ description: 'Services to check' })
  @IsArray()
  @IsString({ each: true })
  services: string[]

  @ApiPropertyOptional({ description: 'Check dependencies' })
  @IsOptional()
  @IsBoolean()
  checkDependencies?: boolean

  @ApiPropertyOptional({ description: 'Timeout in seconds' })
  @IsOptional()
  @IsNumber()
  timeout?: number
}

// Operation
export class TraceRequestDto {
  @ApiProperty({ description: 'Request ID or pattern to trace' })
  @IsString()
  requestId: string

  @ApiPropertyOptional({ description: 'Include distributed tracing' })
  @IsOptional()
  @IsBoolean()
  distributed?: boolean

  @ApiPropertyOptional({ description: 'Services to trace through' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[]
}