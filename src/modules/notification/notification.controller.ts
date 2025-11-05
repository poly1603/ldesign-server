import { Controller, Post, Get, Put, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { NotificationService } from './notification.service.js'
import {
  SendEmailDto, SendWebhookDto, SendWebSocketDto, BatchNotificationDto,
  CreateTemplateDto, UpdateTemplateDto, GetNotificationHistoryDto,
  ConfigureNotificationDto, RetryNotificationDto,
} from './dto/notification.dto.js'

@ApiTags('notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('email')
  @ApiOperation({ summary: 'Send email notification' })
  @ApiResponse({ status: 200, description: 'Email sent' })
  async sendEmail(@Body() emailDto: SendEmailDto) {
    try {
      return await this.notificationService.sendEmail(emailDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to send email', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Send webhook notification' })
  @ApiResponse({ status: 200, description: 'Webhook sent' })
  async sendWebhook(@Body() webhookDto: SendWebhookDto) {
    try {
      return await this.notificationService.sendWebhook(webhookDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to send webhook', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('websocket')
  @ApiOperation({ summary: 'Send WebSocket notification' })
  @ApiResponse({ status: 200, description: 'WebSocket sent' })
  async sendWebSocket(@Body() wsDto: SendWebSocketDto) {
    try {
      return await this.notificationService.sendWebSocket(wsDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to send websocket', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch send notifications' })
  @ApiResponse({ status: 200, description: 'Batch sent' })
  async batchNotification(@Body() batchDto: BatchNotificationDto) {
    try {
      return await this.notificationService.batchNotification(batchDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Batch send failed', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('template')
  @ApiOperation({ summary: 'Create notification template' })
  @ApiResponse({ status: 200, description: 'Template created' })
  async createTemplate(@Body() templateDto: CreateTemplateDto): Promise<any> {
    try {
      return await this.notificationService.createTemplate(templateDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to create template', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('templates')
  @ApiOperation({ summary: 'List templates' })
  @ApiResponse({ status: 200, description: 'Templates listed' })
  async listTemplates(): Promise<any> {
    try {
      return await this.notificationService.listTemplates()
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to list templates', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('template/:id')
  @ApiOperation({ summary: 'Get template' })
  @ApiResponse({ status: 200, description: 'Template retrieved' })
  async getTemplate(@Param('id') id: string): Promise<any> {
    try {
      return await this.notificationService.getTemplate(id)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to get template', HttpStatus.BAD_REQUEST)
    }
  }

  @Put('template/:id')
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  async updateTemplate(@Param('id') id: string, @Body() updateDto: UpdateTemplateDto): Promise<any> {
    try {
      return await this.notificationService.updateTemplate(id, updateDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to update template', HttpStatus.BAD_REQUEST)
    }
  }

  @Delete('template/:id')
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  async deleteTemplate(@Param('id') id: string) {
    try {
      return await this.notificationService.deleteTemplate(id)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to delete template', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('history')
  @ApiOperation({ summary: 'Get notification history' })
  @ApiResponse({ status: 200, description: 'History retrieved' })
  async getHistory(@Body() historyDto: GetNotificationHistoryDto): Promise<any> {
    try {
      return await this.notificationService.getHistory(historyDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to get history', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('status/:id')
  @ApiOperation({ summary: 'Get notification status' })
  @ApiResponse({ status: 200, description: 'Status retrieved' })
  async getStatus(@Param('id') id: string): Promise<any> {
    try {
      return await this.notificationService.getStatus(id)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to get status', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('configure')
  @ApiOperation({ summary: 'Configure notification settings' })
  @ApiResponse({ status: 200, description: 'Settings configured' })
  async configure(@Body() configDto: ConfigureNotificationDto) {
    try {
      return await this.notificationService.configure(configDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to configure', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('retry')
  @ApiOperation({ summary: 'Retry failed notification' })
  @ApiResponse({ status: 200, description: 'Notification retried' })
  async retry(@Body() retryDto: RetryNotificationDto) {
    try {
      return await this.notificationService.retry(retryDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to retry', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics() {
    try {
      return await this.notificationService.getStatistics()
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to get statistics', HttpStatus.BAD_REQUEST)
    }
  }
}
