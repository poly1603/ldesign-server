import { 
  Controller, 
  Post, 
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { PerformanceService } from './performance.service.js'
import {
  RunPerformanceTestDto,
  ProfileApplicationDto,
  MeasureWebPerformanceDto,
  GetOptimizationSuggestionsDto,
  RunBenchmarkDto,
  AnalyzeMemoryDto,
  SetPerformanceBudgetDto,
  GeneratePerformanceReportDto,
  MonitorPerformanceDto,
} from './dto/performance.dto.js'

@ApiTags('performance')
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Post('test')
  @ApiOperation({ summary: 'Run performance test' })
  @ApiResponse({ status: 200, description: 'Test completed' })
  async runPerformanceTest(@Body() testDto: RunPerformanceTestDto) {
    try {
      return await this.performanceService.runPerformanceTest(testDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Performance test failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('profile')
  @ApiOperation({ summary: 'Profile application performance' })
  @ApiResponse({ status: 200, description: 'Profiling completed' })
  async profileApplication(@Body() profileDto: ProfileApplicationDto) {
    try {
      return await this.performanceService.profileApplication(profileDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Profiling failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('web')
  @ApiOperation({ summary: 'Measure web performance' })
  @ApiResponse({ status: 200, description: 'Measurement completed' })
  async measureWebPerformance(@Body() webDto: MeasureWebPerformanceDto) {
    try {
      return await this.performanceService.measureWebPerformance(webDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Web performance measurement failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('optimize')
  @ApiOperation({ summary: 'Get optimization suggestions' })
  @ApiResponse({ status: 200, description: 'Suggestions generated' })
  async getOptimizationSuggestions(@Body() suggestionsDto: GetOptimizationSuggestionsDto) {
    try {
      return await this.performanceService.getOptimizationSuggestions(suggestionsDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get optimization suggestions',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('benchmark')
  @ApiOperation({ summary: 'Run benchmark' })
  @ApiResponse({ status: 200, description: 'Benchmark completed' })
  async runBenchmark(@Body() benchmarkDto: RunBenchmarkDto) {
    try {
      return await this.performanceService.runBenchmark(benchmarkDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Benchmark failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('memory')
  @ApiOperation({ summary: 'Analyze memory usage' })
  @ApiResponse({ status: 200, description: 'Memory analysis completed' })
  async analyzeMemory(@Body() memoryDto: AnalyzeMemoryDto) {
    try {
      return await this.performanceService.analyzeMemory(memoryDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Memory analysis failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('budget')
  @ApiOperation({ summary: 'Set performance budget' })
  @ApiResponse({ status: 200, description: 'Budget configured' })
  async setPerformanceBudget(@Body() budgetDto: SetPerformanceBudgetDto) {
    try {
      return await this.performanceService.setPerformanceBudget(budgetDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to set performance budget',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('report')
  @ApiOperation({ summary: 'Generate performance report' })
  @ApiResponse({ status: 200, description: 'Report generated' })
  async generatePerformanceReport(@Body() reportDto: GeneratePerformanceReportDto) {
    try {
      return await this.performanceService.generatePerformanceReport(reportDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to generate performance report',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('monitor')
  @ApiOperation({ summary: 'Monitor performance' })
  @ApiResponse({ status: 200, description: 'Monitoring started' })
  async monitorPerformance(@Body() monitorDto: MonitorPerformanceDto) {
    try {
      return await this.performanceService.monitorPerformance(monitorDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to start performance monitoring',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
