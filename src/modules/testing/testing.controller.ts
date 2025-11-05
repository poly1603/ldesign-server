import { Controller, Post, Get, Body, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { TestingService } from './testing.service.js'
import { RunTestsDto, RunE2ETestsDto, GetCoverageDto, LintDto } from './dto/testing.dto.js'

@ApiTags('testing')
@Controller('testing')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Post('run')
  @ApiOperation({ summary: 'Run unit/integration tests' })
  @ApiResponse({ status: 200, description: 'Tests executed' })
  async runTests(@Body() runDto: RunTestsDto): Promise<any> {
    try {
      return await this.testingService.runTests(runDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to run tests', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('e2e')
  @ApiOperation({ summary: 'Run E2E tests' })
  @ApiResponse({ status: 200, description: 'E2E tests executed' })
  async runE2ETests(@Body() runDto: RunE2ETestsDto): Promise<any> {
    try {
      return await this.testingService.runE2ETests(runDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to run E2E tests', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('coverage')
  @ApiOperation({ summary: 'Get test coverage report' })
  @ApiResponse({ status: 200, description: 'Coverage report retrieved' })
  async getCoverage(@Body() coverageDto: GetCoverageDto): Promise<any> {
    try {
      return await this.testingService.getCoverage(coverageDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to get coverage', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('lint')
  @ApiOperation({ summary: 'Run linter' })
  @ApiResponse({ status: 200, description: 'Linting completed' })
  async runLint(@Body() lintDto: LintDto): Promise<any> {
    try {
      return await this.testingService.runLint(lintDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to run lint', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('typecheck')
  @ApiOperation({ summary: 'Run TypeScript type checking' })
  @ApiResponse({ status: 200, description: 'Type checking completed' })
  async runTypeCheck(@Body() body: { projectPath: string }): Promise<any> {
    try {
      return await this.testingService.runTypeCheck(body.projectPath)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to type check', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('scripts')
  @ApiOperation({ summary: 'List available test scripts' })
  @ApiResponse({ status: 200, description: 'Test scripts listed' })
  async listTestScripts(@Body() body: { projectPath: string }): Promise<any> {
    try {
      return await this.testingService.listTestScripts(body.projectPath)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to list scripts', HttpStatus.BAD_REQUEST)
    }
  }
}
