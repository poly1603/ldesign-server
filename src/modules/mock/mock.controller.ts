import { 
  Controller, 
  Post, 
  Get,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { MockService } from './mock.service.js'
import {
  GenerateMockDataDto,
  CreateMockApiDto,
  StartMockServerDto,
  GenerateMockDatabaseDto,
  MockFileUploadDto,
  CreateMockWebSocketDto,
  GenerateTestDataDto,
  ImportExportMockDto,
  ConfigureMockInterceptorDto,
} from './dto/mock.dto.js'

@ApiTags('mock')
@Controller('mock')
export class MockController {
  constructor(private readonly mockService: MockService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate mock data' })
  @ApiResponse({ status: 200, description: 'Mock data generated' })
  async generateMockData(@Body() generateDto: GenerateMockDataDto) {
    try {
      return await this.mockService.generateMockData(generateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to generate mock data',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('api')
  @ApiOperation({ summary: 'Create mock API endpoint' })
  @ApiResponse({ status: 200, description: 'Mock API created' })
  async createMockApi(@Body() apiDto: CreateMockApiDto) {
    try {
      return await this.mockService.createMockApi(apiDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create mock API',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('server/start')
  @ApiOperation({ summary: 'Start mock server' })
  @ApiResponse({ status: 200, description: 'Mock server started' })
  async startMockServer(@Body() serverDto: StartMockServerDto) {
    try {
      return await this.mockService.startMockServer(serverDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to start mock server',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('database')
  @ApiOperation({ summary: 'Generate mock database' })
  @ApiResponse({ status: 200, description: 'Mock database generated' })
  async generateMockDatabase(@Body() dbDto: GenerateMockDatabaseDto) {
    try {
      return await this.mockService.generateMockDatabase(dbDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to generate mock database',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('file-upload')
  @ApiOperation({ summary: 'Mock file upload' })
  @ApiResponse({ status: 200, description: 'File upload mocked' })
  async mockFileUpload(@Body() fileDto: MockFileUploadDto) {
    try {
      return await this.mockService.mockFileUpload(fileDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to mock file upload',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('websocket')
  @ApiOperation({ summary: 'Create mock WebSocket' })
  @ApiResponse({ status: 200, description: 'Mock WebSocket created' })
  async createMockWebSocket(@Body() wsDto: CreateMockWebSocketDto) {
    try {
      return await this.mockService.createMockWebSocket(wsDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create mock WebSocket',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('test-data')
  @ApiOperation({ summary: 'Generate test data' })
  @ApiResponse({ status: 200, description: 'Test data generated' })
  async generateTestData(@Body() testDto: GenerateTestDataDto) {
    try {
      return await this.mockService.generateTestData(testDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to generate test data',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('config')
  @ApiOperation({ summary: 'Import/Export mock configuration' })
  @ApiResponse({ status: 200, description: 'Configuration processed' })
  async importExportMock(@Body() ieDto: ImportExportMockDto) {
    try {
      return await this.mockService.importExportMock(ieDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to process mock configuration',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('interceptor')
  @ApiOperation({ summary: 'Configure mock interceptor' })
  @ApiResponse({ status: 200, description: 'Interceptor configured' })
  async configureMockInterceptor(@Body() interceptorDto: ConfigureMockInterceptorDto) {
    try {
      return await this.mockService.configureMockInterceptor(interceptorDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to configure interceptor',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('server/status')
  @ApiOperation({ summary: 'Get mock server status' })
  @ApiResponse({ status: 200, description: 'Server status retrieved' })
  async getMockServerStatus() {
    try {
      return await this.mockService.getMockServerStatus()
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get server status',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
