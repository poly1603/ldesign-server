import { 
  Controller, 
  Post, 
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { WorkflowService } from './workflow.service.js'
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  ExecuteWorkflowDto,
  StopWorkflowDto,
  ListWorkflowsDto,
  GetExecutionHistoryDto,
  ImportWorkflowDto,
  CreateTemplateDto,
  ValidateWorkflowDto,
} from './dto/workflow.dto.js'

@ApiTags('workflow')
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  @ApiOperation({ summary: 'Create workflow' })
  @ApiResponse({ status: 200, description: 'Workflow created' })
  async createWorkflow(@Body() createDto: CreateWorkflowDto): Promise<any> {
    try {
      return await this.workflowService.createWorkflow(createDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create workflow',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('list')
  @ApiOperation({ summary: 'List workflows' })
  @ApiResponse({ status: 200, description: 'Workflows listed' })
  async listWorkflows(@Body() listDto: ListWorkflowsDto): Promise<any> {
    try {
      return await this.workflowService.listWorkflows(listDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to list workflows',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow' })
  @ApiResponse({ status: 200, description: 'Workflow retrieved' })
  async getWorkflow(@Param('id') id: string): Promise<any> {
    try {
      return await this.workflowService.getWorkflow(id)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get workflow',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update workflow' })
  @ApiResponse({ status: 200, description: 'Workflow updated' })
  async updateWorkflow(@Param('id') id: string, @Body() updateDto: UpdateWorkflowDto): Promise<any> {
    try {
      return await this.workflowService.updateWorkflow(id, updateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to update workflow',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workflow' })
  @ApiResponse({ status: 200, description: 'Workflow deleted' })
  async deleteWorkflow(@Param('id') id: string) {
    try {
      return await this.workflowService.deleteWorkflow(id)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to delete workflow',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('execute')
  @ApiOperation({ summary: 'Execute workflow' })
  @ApiResponse({ status: 200, description: 'Workflow execution started' })
  async executeWorkflow(@Body() executeDto: ExecuteWorkflowDto) {
    try {
      return await this.workflowService.executeWorkflow(executeDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to execute workflow',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('stop')
  @ApiOperation({ summary: 'Stop workflow execution' })
  @ApiResponse({ status: 200, description: 'Workflow stopped' })
  async stopWorkflow(@Body() stopDto: StopWorkflowDto): Promise<any> {
    try {
      return await this.workflowService.stopWorkflow(stopDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to stop workflow',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('execution/:id')
  @ApiOperation({ summary: 'Get execution status' })
  @ApiResponse({ status: 200, description: 'Status retrieved' })
  async getExecutionStatus(@Param('id') id: string): Promise<any> {
    try {
      return await this.workflowService.getExecutionStatus(id)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get status',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('history')
  @ApiOperation({ summary: 'Get execution history' })
  @ApiResponse({ status: 200, description: 'History retrieved' })
  async getExecutionHistory(@Body() historyDto: GetExecutionHistoryDto): Promise<any> {
    try {
      return await this.workflowService.getExecutionHistory(historyDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get history',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export workflow' })
  @ApiResponse({ status: 200, description: 'Workflow exported' })
  async exportWorkflow(@Param('id') id: string): Promise<any> {
    try {
      return await this.workflowService.exportWorkflow(id)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to export workflow',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('import')
  @ApiOperation({ summary: 'Import workflow' })
  @ApiResponse({ status: 200, description: 'Workflow imported' })
  async importWorkflow(@Body() importDto: ImportWorkflowDto): Promise<any> {
    try {
      return await this.workflowService.importWorkflow(importDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to import workflow',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate workflow' })
  @ApiResponse({ status: 200, description: 'Workflow validated' })
  async validateWorkflow(@Body() validateDto: ValidateWorkflowDto) {
    try {
      return await this.workflowService.validateWorkflow(validateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to validate workflow',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('template')
  @ApiOperation({ summary: 'Create workflow template' })
  @ApiResponse({ status: 200, description: 'Template created' })
  async createTemplate(@Body() templateDto: CreateTemplateDto) {
    try {
      return await this.workflowService.createTemplate(templateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create template',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('templates/list')
  @ApiOperation({ summary: 'List workflow templates' })
  @ApiResponse({ status: 200, description: 'Templates listed' })
  async listTemplates() {
    try {
      return await this.workflowService.listTemplates()
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to list templates',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
