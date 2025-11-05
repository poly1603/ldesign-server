import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  IsEmail,
  IsUrl,
} from 'class-validator'

// Operation
export enum NotificationType {
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  WEBSOCKET = 'websocket',
  SMS = 'sms',
}

// Operation
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
}

// Operation
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Operation
export class SendEmailDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsEmail()
  to: string

  @ApiPropertyOptional({ description: 'CC email addresses' })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  cc?: string[]

  @ApiPropertyOptional({ description: 'BCC email addresses' })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  bcc?: string[]

  @ApiProperty({ description: 'Email subject' })
  @IsString()
  subject: string

  @ApiProperty({ description: 'Email body (HTML or text)' })
  @IsString()
  body: string

  @ApiPropertyOptional({ description: 'Email is HTML' })
  @IsOptional()
  @IsBoolean()
  isHtml?: boolean

  @ApiPropertyOptional({ description: 'Attachments' })
  @IsOptional()
  @IsArray()
  attachments?: Array<{
    filename: string
    path?: string
    content?: string
  }>

  @ApiPropertyOptional({ description: 'Email template ID' })
  @IsOptional()
  @IsString()
  templateId?: string

  @ApiPropertyOptional({ description: 'Template variables' })
  @IsOptional()
  @IsObject()
  templateVars?: Record<string, any>
}

// Operation
export class SendWebhookDto {
  @ApiProperty({ description: 'Webhook URL' })
  @IsUrl()
  url: string

  @ApiProperty({ description: 'Webhook method' })
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE'])
  method: string

  @ApiProperty({ description: 'Webhook payload' })
  @IsObject()
  payload: Record<string, any>

  @ApiPropertyOptional({ description: 'Custom headers' })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>

  @ApiPropertyOptional({ description: 'Authentication token' })
  @IsOptional()
  @IsString()
  auth?: string

  @ApiPropertyOptional({ description: 'Retry on failure' })
  @IsOptional()
  @IsBoolean()
  retry?: boolean

  @ApiPropertyOptional({ description: 'Max retries' })
  @IsOptional()
  maxRetries?: number

  @ApiPropertyOptional({ description: 'Timeout in ms' })
  @IsOptional()
  timeout?: number
}

// Operation
export class SendWebSocketDto {
  @ApiProperty({ description: 'Event name' })
  @IsString()
  event: string

  @ApiProperty({ description: 'Event data' })
  @IsObject()
  data: Record<string, any>

  @ApiPropertyOptional({ description: 'Target user IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetUsers?: string[]

  @ApiPropertyOptional({ description: 'Target room' })
  @IsOptional()
  @IsString()
  room?: string

  @ApiPropertyOptional({ description: 'Broadcast to all' })
  @IsOptional()
  @IsBoolean()
  broadcast?: boolean
}

// Operation
export class BatchNotificationDto {
  @ApiProperty({ enum: NotificationType, description: 'Notification type' })
  @IsEnum(NotificationType)
  type: NotificationType

  @ApiProperty({ description: 'Recipients' })
  @IsArray()
  recipients: Array<{
    to: string
    data?: Record<string, any>
  }>

  @ApiPropertyOptional({ description: 'Common template ID' })
  @IsOptional()
  @IsString()
  templateId?: string

  @ApiPropertyOptional({ description: 'Common data' })
  @IsOptional()
  @IsObject()
  commonData?: Record<string, any>

  @ApiPropertyOptional({ enum: NotificationPriority })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority
}

// Operation
export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string

  @ApiProperty({ enum: NotificationType, description: 'Template type' })
  @IsEnum(NotificationType)
  type: NotificationType

  @ApiProperty({ description: 'Template subject (for email)' })
  @IsString()
  subject: string

  @ApiProperty({ description: 'Template content' })
  @IsString()
  content: string

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Template variables' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[]

  @ApiPropertyOptional({ description: 'Template category' })
  @IsOptional()
  @IsString()
  category?: string
}

// Operation
export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Template subject' })
  @IsOptional()
  @IsString()
  subject?: string

  @ApiPropertyOptional({ description: 'Template content' })
  @IsOptional()
  @IsString()
  content?: string

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Template variables' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[]
}

// Operation
export class GetNotificationHistoryDto {
  @ApiPropertyOptional({ enum: NotificationType, description: 'Filter by type' })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType

  @ApiPropertyOptional({ enum: NotificationStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus

  @ApiPropertyOptional({ description: 'Recipient filter' })
  @IsOptional()
  @IsString()
  recipient?: string

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsString()
  startDate?: string

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsString()
  endDate?: string

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsOptional()
  limit?: number

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  page?: number
}

// Operation
export class GetNotificationStatusDto {
  @ApiProperty({ description: 'Notification ID' })
  @IsString()
  notificationId: string
}

// Operation
export class ConfigureNotificationDto {
  @ApiPropertyOptional({ description: 'SMTP settings' })
  @IsOptional()
  @IsObject()
  smtp?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
    from: string
  }

  @ApiPropertyOptional({ description: 'Webhook settings' })
  @IsOptional()
  @IsObject()
  webhook?: {
    defaultTimeout: number
    maxRetries: number
    retryDelay: number
  }

  @ApiPropertyOptional({ description: 'WebSocket settings' })
  @IsOptional()
  @IsObject()
  websocket?: {
    enabled: boolean
    port: number
    path: string
  }

  @ApiPropertyOptional({ description: 'Rate limiting' })
  @IsOptional()
  @IsObject()
  rateLimit?: {
    enabled: boolean
    maxPerMinute: number
    maxPerHour: number
  }
}

// Operation
export class RetryNotificationDto {
  @ApiProperty({ description: 'Notification ID' })
  @IsString()
  notificationId: string

  @ApiPropertyOptional({ description: 'Force retry' })
  @IsOptional()
  @IsBoolean()
  force?: boolean
}
