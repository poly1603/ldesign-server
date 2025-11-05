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
import { SchedulerService } from './scheduler.service.js'
import {
  CreateJobDto,
  UpdateJobDto,
  ExecuteJobDto,
  ValidateCronDto,
  ListJobsDto,
  GetJobHistoryDto,
  GetJobLogsDto,
} from './dto/scheduler.dto.js'

@ApiTags('scheduler')
@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('jobs')
  @ApiOperation({ summary: 'Create new job' })
  @ApiResponse({ status: 200, description: 'Job created' })
  async createJob(@Body() createDto: CreateJobDto): Promise<any> {
    try {
      return await this.schedulerService.createJob(createDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create job',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('jobs/list')
  @ApiOperation({ summary: 'List jobs' })
  @ApiResponse({ status: 200, description: 'Jobs listed' })
  async listJobs(@Body() listDto: ListJobsDto): Promise<any> {
    try {
      return await this.schedulerService.listJobs(listDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to list jobs',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get job by ID' })
  @ApiResponse({ status: 200, description: 'Job retrieved' })
  async getJob(@Param('id') id: string): Promise<any> {
    try {
      return await this.schedulerService.getJob(id)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get job',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Put('jobs/:id')
  @ApiOperation({ summary: 'Update job' })
  @ApiResponse({ status: 200, description: 'Job updated' })
  async updateJob(@Param('id') id: string, @Body() updateDto: UpdateJobDto): Promise<any> {
    try {
      return await this.schedulerService.updateJob(id, updateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to update job',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Delete('jobs/:id')
  @ApiOperation({ summary: 'Delete job' })
  @ApiResponse({ status: 200, description: 'Job deleted' })
  async deleteJob(@Param('id') id: string) {
    try {
      return await this.schedulerService.deleteJob(id)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to delete job',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('jobs/execute')
  @ApiOperation({ summary: 'Execute job manually' })
  @ApiResponse({ status: 200, description: 'Job execution started' })
  async executeJob(@Body() executeDto: ExecuteJobDto) {
    try {
      return await this.schedulerService.executeJob(executeDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to execute job',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('jobs/:id/pause')
  @ApiOperation({ summary: 'Pause job' })
  @ApiResponse({ status: 200, description: 'Job paused' })
  async pauseJob(@Param('id') id: string): Promise<any> {
    try {
      return await this.schedulerService.pauseJob(id)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to pause job',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('jobs/:id/resume')
  @ApiOperation({ summary: 'Resume job' })
  @ApiResponse({ status: 200, description: 'Job resumed' })
  async resumeJob(@Param('id') id: string): Promise<any> {
    try {
      return await this.schedulerService.resumeJob(id)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to resume job',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('jobs/history')
  @ApiOperation({ summary: 'Get job execution history' })
  @ApiResponse({ status: 200, description: 'History retrieved' })
  async getJobHistory(@Body() historyDto: GetJobHistoryDto) {
    try {
      return await this.schedulerService.getJobHistory(historyDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get history',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('jobs/logs')
  @ApiOperation({ summary: 'Get job logs' })
  @ApiResponse({ status: 200, description: 'Logs retrieved' })
  async getJobLogs(@Body() logsDto: GetJobLogsDto) {
    try {
      return await this.schedulerService.getJobLogs(logsDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get logs',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('cron/validate')
  @ApiOperation({ summary: 'Validate cron expression' })
  @ApiResponse({ status: 200, description: 'Cron validated' })
  async validateCron(@Body() validateDto: ValidateCronDto) {
    try {
      return await this.schedulerService.validateCron(validateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to validate cron',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
