import { 
  Controller, 
  Post, 
  Get,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { MonitorService } from './monitor.service.js'
import {
  StartMonitoringDto,
  GetMetricsDto,
  SetAlertDto,
  CreateDashboardDto,
  GenerateReportDto,
  ConfigureLoggingDto,
  AnalyzePerformanceDto,
  HealthCheckDto,
  TraceRequestDto,
} from './dto/monitor.dto.js'

@ApiTags('monitor')
@Controller('monitor')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start monitoring' })
  @ApiResponse({ status: 200, description: 'Monitoring started' })
  async startMonitoring(@Body() monitorDto: StartMonitoringDto) {
    try {
      return await this.monitorService.startMonitoring(monitorDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to start monitoring',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('metrics')
  @ApiOperation({ summary: 'Get metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved' })
  async getMetrics(@Body() metricsDto: GetMetricsDto) {
    try {
      return await this.monitorService.getMetrics(metricsDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get metrics',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('alert')
  @ApiOperation({ summary: 'Set alert' })
  @ApiResponse({ status: 200, description: 'Alert configured' })
  async setAlert(@Body() alertDto: SetAlertDto) {
    try {
      return await this.monitorService.setAlert(alertDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to set alert',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('dashboard')
  @ApiOperation({ summary: 'Create dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard created' })
  async createDashboard(@Body() dashboardDto: CreateDashboardDto) {
    try {
      return await this.monitorService.createDashboard(dashboardDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create dashboard',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('report')
  @ApiOperation({ summary: 'Generate monitoring report' })
  @ApiResponse({ status: 200, description: 'Report generated' })
  async generateReport(@Body() reportDto: GenerateReportDto) {
    try {
      return await this.monitorService.generateReport(reportDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to generate report',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('logging')
  @ApiOperation({ summary: 'Configure logging' })
  @ApiResponse({ status: 200, description: 'Logging configured' })
  async configureLogging(@Body() loggingDto: ConfigureLoggingDto) {
    try {
      return await this.monitorService.configureLogging(loggingDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to configure logging',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('performance')
  @ApiOperation({ summary: 'Analyze performance' })
  @ApiResponse({ status: 200, description: 'Performance analyzed' })
  async analyzePerformance(@Body() performanceDto: AnalyzePerformanceDto) {
    try {
      return await this.monitorService.analyzePerformance(performanceDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to analyze performance',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('health')
  @ApiOperation({ summary: 'Perform health check' })
  @ApiResponse({ status: 200, description: 'Health check completed' })
  async healthCheck(@Body() healthDto: HealthCheckDto) {
    try {
      return await this.monitorService.healthCheck(healthDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Health check failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('trace')
  @ApiOperation({ summary: 'Trace request' })
  @ApiResponse({ status: 200, description: 'Request traced' })
  async traceRequest(@Body() traceDto: TraceRequestDto) {
    try {
      return await this.monitorService.traceRequest(traceDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to trace request',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Get monitoring status' })
  @ApiResponse({ status: 200, description: 'Status retrieved' })
  async getMonitoringStatus() {
    try {
      return await this.monitorService.getMonitoringStatus()
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get monitoring status',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
