import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

// Operation
export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Operation
export enum StepType {
  COMMAND = 'command',
  API = 'api',
  SCRIPT = 'script',
  CONDITION = 'condition',
  PARALLEL = 'parallel',
  WAIT = 'wait',
  NOTIFICATION = 'notification',
}

// Operation
export enum ExecutionMode {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
}

// Operation
export class WorkflowStepDto {
  @ApiProperty({ description: 'Step ID' })
  @IsString()
  id: string

  @ApiProperty({ description: 'Step name' })
  @IsString()
  name: string

  @ApiProperty({ enum: StepType, description: 'Step type' })
  @IsEnum(StepType)
  type: StepType

  @ApiProperty({ description: 'Step configuration' })
  @IsObject()
  config: Record<string, any>

  @ApiPropertyOptional({ description: 'Next step ID(s)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  next?: string[]

  @ApiPropertyOptional({ description: 'Condition for execution' })
  @IsOptional()
  @IsString()
  condition?: string

  @ApiPropertyOptional({ description: 'Retry count on failure' })
  @IsOptional()
  retryCount?: number

  @ApiPropertyOptional({ description: 'Timeout in ms' })
  @IsOptional()
  timeout?: number

  @ApiPropertyOptional({ description: 'Continue on error' })
  @IsOptional()
  @IsBoolean()
  continueOnError?: boolean
}

// Operation
export class CreateWorkflowDto {
  @ApiProperty({ description: 'Workflow name' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Workflow description' })
  @IsString()
  description: string

  @ApiProperty({ description: 'Workflow steps' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[]

  @ApiPropertyOptional({ enum: ExecutionMode, description: 'Execution mode' })
  @IsOptional()
  @IsEnum(ExecutionMode)
  mode?: ExecutionMode

  @ApiPropertyOptional({ description: 'Workflow variables' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>

  @ApiPropertyOptional({ description: 'Workflow tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional({ description: 'Enable workflow' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

// Operation
export class UpdateWorkflowDto {
  @ApiPropertyOptional({ description: 'Workflow name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Workflow description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Workflow steps' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps?: WorkflowStepDto[]

  @ApiPropertyOptional({ description: 'Workflow variables' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>

  @ApiPropertyOptional({ description: 'Workflow tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional({ description: 'Enable workflow' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean
}

// Operation
export class ExecuteWorkflowDto {
  @ApiProperty({ description: 'Workflow ID' })
  @IsString()
  workflowId: string

  @ApiPropertyOptional({ description: 'Input data for workflow' })
  @IsOptional()
  @IsObject()
  input?: Record<string, any>

  @ApiPropertyOptional({ description: 'Override variables' })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>

  @ApiPropertyOptional({ description: 'Dry run mode' })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean
}

// Operation
export class StopWorkflowDto {
  @ApiProperty({ description: 'Execution ID' })
  @IsString()
  executionId: string

  @ApiPropertyOptional({ description: 'Force stop' })
  @IsOptional()
  @IsBoolean()
  force?: boolean
}

// Operation
export class ListWorkflowsDto {
  @ApiPropertyOptional({ enum: WorkflowStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus

  @ApiPropertyOptional({ description: 'Filter by tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  page?: number

  @ApiPropertyOptional({ description: 'Page size' })
  @IsOptional()
  pageSize?: number
}

// Operation
export class GetExecutionHistoryDto {
  @ApiProperty({ description: 'Workflow ID' })
  @IsString()
  workflowId: string

  @ApiPropertyOptional({ enum: WorkflowStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsOptional()
  limit?: number
}

// Operation
export class ImportWorkflowDto {
  @ApiProperty({ description: 'Workflow definition (JSON)' })
  @IsObject()
  definition: Record<string, any>

  @ApiPropertyOptional({ description: 'Overwrite existing workflow' })
  @IsOptional()
  @IsBoolean()
  overwrite?: boolean
}

// Operation
export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string

  @ApiProperty({ description: 'Template description' })
  @IsString()
  description: string

  @ApiProperty({ description: 'Workflow definition' })
  @IsObject()
  definition: Record<string, any>

  @ApiPropertyOptional({ description: 'Template category' })
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional({ description: 'Template tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

// Operation
export class ValidateWorkflowDto {
  @ApiProperty({ description: 'Workflow steps' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[]
}
