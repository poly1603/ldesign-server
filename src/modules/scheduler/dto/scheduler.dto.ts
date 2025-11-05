import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsObject,
  IsNumber,
  IsDateString,
} from 'class-validator'

// Operation
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

// Operation
export enum JobType {
  CRON = 'cron',
  ONCE = 'once',
  INTERVAL = 'interval',
}

// Operation
export class CreateJobDto {
  @ApiProperty({ description: 'Job name' })
  @IsString()
  name: string

  @ApiProperty({ enum: JobType, description: 'Job type' })
  @IsEnum(JobType)
  type: JobType

  @ApiPropertyOptional({ description: 'Cron expression (for cron jobs)' })
  @IsOptional()
  @IsString()
  cronExpression?: string

  @ApiPropertyOptional({ description: 'Interval in ms (for interval jobs)' })
  @IsOptional()
  @IsNumber()
  interval?: number

  @ApiPropertyOptional({ description: 'Start time (for once jobs)' })
  @IsOptional()
  @IsDateString()
  startTime?: string

  @ApiProperty({ description: 'Job data/payload' })
  @IsObject()
  data: Record<string, any>

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Max retries on failure' })
  @IsOptional()
  @IsNumber()
  maxRetries?: number

  @ApiPropertyOptional({ description: 'Timeout in ms' })
  @IsOptional()
  @IsNumber()
  timeout?: number

  @ApiPropertyOptional({ description: 'Enable job' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

// Operation
export class UpdateJobDto {
  @ApiPropertyOptional({ description: 'Job name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Cron expression' })
  @IsOptional()
  @IsString()
  cronExpression?: string

  @ApiPropertyOptional({ description: 'Interval in ms' })
  @IsOptional()
  @IsNumber()
  interval?: number

  @ApiPropertyOptional({ description: 'Job data/payload' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>

  @ApiPropertyOptional({ description: 'Job description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Max retries' })
  @IsOptional()
  @IsNumber()
  maxRetries?: number

  @ApiPropertyOptional({ description: 'Timeout in ms' })
  @IsOptional()
  @IsNumber()
  timeout?: number

  @ApiPropertyOptional({ description: 'Enable job' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

// Operation
export class ExecuteJobDto {
  @ApiProperty({ description: 'Job ID' })
  @IsString()
  jobId: string

  @ApiPropertyOptional({ description: 'Override job data' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>
}

// Operation
export class ValidateCronDto {
  @ApiProperty({ description: 'Cron expression to validate' })
  @IsString()
  expression: string
}

// Operation
export class ListJobsDto {
  @ApiPropertyOptional({ enum: JobStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus

  @ApiPropertyOptional({ enum: JobType, description: 'Filter by type' })
  @IsOptional()
  @IsEnum(JobType)
  type?: JobType

  @ApiPropertyOptional({ description: 'Filter enabled/disabled jobs' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @IsNumber()
  page?: number

  @ApiPropertyOptional({ description: 'Page size' })
  @IsOptional()
  @IsNumber()
  pageSize?: number
}

// Operation
export class GetJobHistoryDto {
  @ApiProperty({ description: 'Job ID' })
  @IsString()
  jobId: string

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsOptional()
  @IsNumber()
  limit?: number

  @ApiPropertyOptional({ enum: JobStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus
}

// Operation
export class GetJobLogsDto {
  @ApiProperty({ description: 'Job ID or execution ID' })
  @IsString()
  id: string

  @ApiPropertyOptional({ description: 'Log level filter' })
  @IsOptional()
  @IsEnum(['info', 'warn', 'error', 'debug'])
  level?: string

  @ApiPropertyOptional({ description: 'Limit log entries' })
  @IsOptional()
  @IsNumber()
  limit?: number
}

// Operation
export class ToggleJobDto {
  @ApiProperty({ description: 'Job ID' })
  @IsString()
  jobId: string
}
