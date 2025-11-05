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
export enum PerformanceTestType {
  LOAD = 'load',
  STRESS = 'stress',
  SPIKE = 'spike',
  ENDURANCE = 'endurance',
  BENCHMARK = 'benchmark',
}

// Operation
export enum ProfileType {
  CPU = 'cpu',
  MEMORY = 'memory',
  HEAP = 'heap',
  FLAME = 'flame',
  TRACE = 'trace',
}

// Operation
export enum MetricType {
  FCP = 'fcp',      // First Contentful Paint
  LCP = 'lcp',      // Largest Contentful Paint
  FID = 'fid',      // First Input Delay
  CLS = 'cls',      // Cumulative Layout Shift
  TTFB = 'ttfb',    // Time to First Byte
  TTI = 'tti',      // Time to Interactive
}

// Operation
export class RunPerformanceTestDto {
  @ApiProperty({ description: 'Target URL or application path' })
  @IsString()
  target: string

  @ApiProperty({ 
    enum: PerformanceTestType,
    description: 'Type of performance test' 
  })
  @IsEnum(PerformanceTestType)
  testType: PerformanceTestType

  @ApiPropertyOptional({ description: 'Number of virtual users' })
  @IsOptional()
  @IsNumber()
  users?: number

  @ApiPropertyOptional({ description: 'Test duration in seconds' })
  @IsOptional()
  @IsNumber()
  duration?: number

  @ApiPropertyOptional({ description: 'Ramp-up time in seconds' })
  @IsOptional()
  @IsNumber()
  rampUp?: number

  @ApiPropertyOptional({ description: 'Test scenarios' })
  @IsOptional()
  @IsArray()
  scenarios?: any[]

  @ApiPropertyOptional({ description: 'Success criteria' })
  @IsOptional()
  @IsObject()
  criteria?: {
    maxResponseTime?: number
    errorRate?: number
    throughput?: number
  }
}

// Operation
export class ProfileApplicationDto {
  @ApiProperty({ description: 'Application path or process ID' })
  @IsString()
  target: string

  @ApiProperty({ 
    enum: ProfileType,
    description: 'Profile type' 
  })
  @IsEnum(ProfileType)
  type: ProfileType

  @ApiPropertyOptional({ description: 'Profiling duration in seconds' })
  @IsOptional()
  @IsNumber()
  duration?: number

  @ApiPropertyOptional({ description: 'Sampling interval in milliseconds' })
  @IsOptional()
  @IsNumber()
  interval?: number

  @ApiPropertyOptional({ description: 'Include native frames' })
  @IsOptional()
  @IsBoolean()
  includeNative?: boolean

  @ApiPropertyOptional({ description: 'Output format' })
  @IsOptional()
  @IsEnum(['json', 'html', 'flamegraph', 'pprof'])
  format?: string
}

// Operation
export class MeasureWebPerformanceDto {
  @ApiProperty({ description: 'Website URL' })
  @IsString()
  url: string

  @ApiPropertyOptional({ description: 'Metrics to measure' })
  @IsOptional()
  @IsArray()
  @IsEnum(MetricType, { each: true })
  metrics?: MetricType[]

  @ApiPropertyOptional({ description: 'Device type' })
  @IsOptional()
  @IsEnum(['desktop', 'mobile', 'tablet'])
  device?: string

  @ApiPropertyOptional({ description: 'Network throttling' })
  @IsOptional()
  @IsEnum(['3g-slow', '3g-fast', '4g', 'wifi', 'none'])
  network?: string

  @ApiPropertyOptional({ description: 'Number of runs' })
  @IsOptional()
  @IsNumber()
  runs?: number

  @ApiPropertyOptional({ description: 'Lighthouse configuration' })
  @IsOptional()
  @IsObject()
  lighthouse?: any
}

// Operation
export class GetOptimizationSuggestionsDto {
  @ApiProperty({ description: 'Analysis results or report ID' })
  @IsString()
  analysisId: string

  @ApiPropertyOptional({ description: 'Focus areas' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areas?: string[]

  @ApiPropertyOptional({ description: 'Priority level' })
  @IsOptional()
  @IsEnum(['critical', 'high', 'medium', 'low'])
  priority?: string

  @ApiPropertyOptional({ description: 'Include code examples' })
  @IsOptional()
  @IsBoolean()
  includeExamples?: boolean
}

// Operation
export class RunBenchmarkDto {
  @ApiProperty({ description: 'Code or function to benchmark' })
  @IsString()
  target: string

  @ApiPropertyOptional({ description: 'Number of iterations' })
  @IsOptional()
  @IsNumber()
  iterations?: number

  @ApiPropertyOptional({ description: 'Warm-up runs' })
  @IsOptional()
  @IsNumber()
  warmup?: number

  @ApiPropertyOptional({ description: 'Compare with baseline' })
  @IsOptional()
  @IsString()
  baseline?: string

  @ApiPropertyOptional({ description: 'Environment variables' })
  @IsOptional()
  @IsObject()
  env?: any
}

// Operation
export class AnalyzeMemoryDto {
  @ApiProperty({ description: 'Application or process to analyze' })
  @IsString()
  target: string

  @ApiPropertyOptional({ description: 'Analysis type' })
  @IsOptional()
  @IsEnum(['heap-snapshot', 'allocation-timeline', 'leak-detection'])
  type?: string

  @ApiPropertyOptional({ description: 'Duration for monitoring' })
  @IsOptional()
  @IsNumber()
  duration?: number

  @ApiPropertyOptional({ description: 'Memory threshold in MB' })
  @IsOptional()
  @IsNumber()
  threshold?: number
}

// Operation
export class SetPerformanceBudgetDto {
  @ApiProperty({ description: 'Project or application name' })
  @IsString()
  project: string

  @ApiProperty({ description: 'Performance budgets' })
  @IsObject()
  budgets: {
    bundles?: Array<{
      name: string
      maxSize: string
    }>
    metrics?: {
      [key in MetricType]?: number
    }
    resources?: Array<{
      type: string
      maxCount?: number
      maxSize?: string
    }>
  }

  @ApiPropertyOptional({ description: 'Enforcement level' })
  @IsOptional()
  @IsEnum(['error', 'warning', 'info'])
  enforcement?: string
}

// Operation
export class GeneratePerformanceReportDto {
  @ApiProperty({ description: 'Test or analysis ID' })
  @IsString()
  testId: string

  @ApiPropertyOptional({ description: 'Report format' })
  @IsOptional()
  @IsEnum(['html', 'pdf', 'json', 'csv'])
  format?: string

  @ApiPropertyOptional({ description: 'Include visualizations' })
  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean

  @ApiPropertyOptional({ description: 'Compare with previous results' })
  @IsOptional()
  @IsString()
  compareWith?: string

  @ApiPropertyOptional({ description: 'Custom sections' })
  @IsOptional()
  @IsArray()
  sections?: string[]
}

// Operation
export class MonitorPerformanceDto {
  @ApiProperty({ description: 'Application or service to monitor' })
  @IsString()
  target: string

  @ApiPropertyOptional({ description: 'Monitoring interval in seconds' })
  @IsOptional()
  @IsNumber()
  interval?: number

  @ApiPropertyOptional({ description: 'Metrics to track' })
  @IsOptional()
  @IsArray()
  metrics?: string[]

  @ApiPropertyOptional({ description: 'Alert thresholds' })
  @IsOptional()
  @IsObject()
  alerts?: any

  @ApiPropertyOptional({ description: 'Enable real-time updates' })
  @IsOptional()
  @IsBoolean()
  realtime?: boolean
}