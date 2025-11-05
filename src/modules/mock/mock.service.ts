import { Injectable, Logger } from '@nestjs/common'
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
  MockServerType,
} from './dto/mock.dto.js'

@Injectable()
export class MockService {
  private readonly logger = new Logger(MockService.name)

  /**
 * API Operation
 */
  async generateMockData(generateDto: GenerateMockDataDto) {
    this.logger.log('Generating mock data')
    
    // Operation
    
    const count = generateDto.count || 10
    const format = generateDto.format || 'json'
    const locale = generateDto.locale || 'en'
    
    // Operation
    const mockData = []
    for (let i = 0; i < count; i++) {
      mockData.push({
        id: `uuid-${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        age: Math.floor(Math.random() * 50) + 20,
        createdAt: new Date().toISOString(),
      })
    }
    
    return {
      success: true,
      data: {
        format,
        locale,
        count: mockData.length,
        seed: generateDto.seed,
        generated: mockData,
      },
      message: `Generated ${count} mock records`,
    }
  }

  /**
 * API Operation
 */
  async createMockApi(apiDto: CreateMockApiDto) {
    this.logger.log(`Creating mock API: ${apiDto.path}`)
    
    // Operation
    
    const method = apiDto.method || 'GET'
    const statusCode = apiDto.statusCode || 200
    
    return {
      success: true,
      data: {
        endpoint: {
          path: apiDto.path,
          method,
          statusCode,
          delay: apiDto.delay || 0,
        },
        response: apiDto.responseSchema,
        request: apiDto.requestSchema,
        headers: apiDto.headers || {},
        created: true,
        url: `http://localhost:3001${apiDto.path}`,
      },
      message: `Mock API created: ${method} ${apiDto.path}`,
    }
  }

  /**
 * API Operation
 */
  async startMockServer(serverDto: StartMockServerDto) {
    this.logger.log('Starting mock server')
    
    // Operation
    
    const port = serverDto.config.port || 3001
    const type = serverDto.type || MockServerType.REST
    
    return {
      success: true,
      data: {
        server: {
          type,
          port,
          host: serverDto.config.host || 'localhost',
          url: `http://localhost:${port}`,
          status: 'running',
          pid: Math.floor(Math.random() * 10000),
        },
        routes: serverDto.config.routes || [],
        cors: serverDto.cors !== false,
        logging: serverDto.logging !== false,
        static: serverDto.static,
        proxy: serverDto.proxy,
        startedAt: new Date().toISOString(),
      },
      message: `Mock server started on port ${port}`,
    }
  }

  /**
 * API Operation
 */
  async generateMockDatabase(dbDto: GenerateMockDatabaseDto) {
    this.logger.log('Generating mock database')
    
    // Operation
    
    const type = dbDto.type || 'sqlite'
    const totalRecords = dbDto.schema.tables.reduce(
      (sum, table) => sum + (table.records || 100),
      0
    )
    
    return {
      success: true,
      data: {
        database: {
          type,
          tables: dbDto.schema.tables.map(table => ({
            name: table.name,
            columns: table.columns.length,
            records: table.records || 100,
          })),
          totalTables: dbDto.schema.tables.length,
          totalRecords,
        },
        withRelations: dbDto.withRelations || false,
        outputFile: dbDto.outputFile || `mock-${type}.db`,
        seedScript: dbDto.seedScript ? 'seed.sql' : null,
      },
      message: `Mock database generated with ${totalRecords} records`,
    }
  }

  /**
 * API Operation
 */
  async mockFileUpload(fileDto: MockFileUploadDto) {
    this.logger.log(`Mocking file upload: ${fileDto.fileType}`)
    
    // Operation
    
    const count = fileDto.count || 1
    const files = []
    
    for (let i = 0; i < count; i++) {
      files.push({
        name: fileDto.fileName || `mock-file-${i}.${fileDto.fileType}`,
        type: fileDto.fileType,
        size: fileDto.size || Math.floor(Math.random() * 1000000),
        url: `https://mock-storage.example.com/file-${i}`,
        metadata: fileDto.metadata || {},
      })
    }
    
    return {
      success: true,
      data: {
        files,
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
        uploadedAt: new Date().toISOString(),
      },
      message: `Mocked ${count} file(s) upload`,
    }
  }

  /**
 * API Operation
 */
  async createMockWebSocket(wsDto: CreateMockWebSocketDto) {
    this.logger.log(`Creating mock WebSocket: ${wsDto.endpoint}`)
    
    // Operation
    
    const port = wsDto.port || 3002
    
    return {
      success: true,
      data: {
        websocket: {
          endpoint: wsDto.endpoint,
          url: `ws://localhost:${port}${wsDto.endpoint}`,
          port,
          status: 'connected',
        },
        events: wsDto.events.map(event => ({
          ...event,
          status: 'configured',
        })),
        auth: wsDto.auth || false,
        broadcast: wsDto.broadcast || false,
        clients: 0,
      },
      message: 'Mock WebSocket created',
    }
  }

  /**
 * API Operation
 */
  async generateTestData(testDto: GenerateTestDataDto) {
    this.logger.log(`Generating test data for: ${testDto.scenario}`)
    
    // Operation
    
    const testData = {
      scenario: testDto.scenario,
      validCases: [],
      invalidCases: [],
      edgeCases: [],
    }
    
    // Operation
    for (let i = 0; i < 5; i++) {
      testData.validCases.push({
        id: i,
        input: `valid-input-${i}`,
        expected: `expected-output-${i}`,
      })
    }
    
    // Operation
    if (testDto.includeEdgeCases) {
      testData.edgeCases = [
        { case: 'null', value: null },
        { case: 'empty', value: '' },
        { case: 'max', value: Number.MAX_SAFE_INTEGER },
        { case: 'min', value: Number.MIN_SAFE_INTEGER },
      ]
    }
    
    return {
      success: true,
      data: {
        testData,
        variations: testDto.variations || [],
        validationRules: testDto.validationRules || [],
        statistics: {
          totalCases: testData.validCases.length + testData.edgeCases.length,
          validCases: testData.validCases.length,
          edgeCases: testData.edgeCases.length,
        },
      },
      message: 'Test data generated',
    }
  }

  /**
 * API Operation
 */
  async importExportMock(ieDto: ImportExportMockDto) {
    this.logger.log(`${ieDto.action || 'export'} mock configuration`)
    
    // Operation
    
    const action = ieDto.action || 'export'
    const format = ieDto.format || 'json'
    
    if (action === 'import') {
      return {
        success: true,
        data: {
          action: 'import',
          filePath: ieDto.filePath,
          format,
          imported: {
            apis: 10,
            schemas: 5,
            configurations: 3,
          },
        },
        message: 'Mock configuration imported',
      }
    } else {
      return {
        success: true,
        data: {
          action: 'export',
          filePath: ieDto.filePath,
          format,
          exported: {
            apis: 15,
            schemas: 8,
            configurations: 4,
          },
          includeSchemas: ieDto.includeSchemas !== false,
          fileSize: '125KB',
        },
        message: 'Mock configuration exported',
      }
    }
  }

  /**
 * API Operation
 */
  async configureMockInterceptor(interceptorDto: ConfigureMockInterceptorDto) {
    this.logger.log(`Configuring mock interceptor for: ${interceptorDto.target}`)
    
    // Operation
    
    return {
      success: true,
      data: {
        interceptor: {
          target: interceptorDto.target,
          enabled: interceptorDto.enabled !== false,
          rules: interceptorDto.rules || [],
          logging: interceptorDto.logging !== false,
        },
        statistics: {
          rulesConfigured: interceptorDto.rules?.length || 0,
          requestsIntercepted: 0,
        },
        status: 'configured',
      },
      message: 'Mock interceptor configured',
    }
  }

  /**
 * API Operation
 */
  async getMockServerStatus() {
    this.logger.log('Getting mock server status')
    
    // Operation
    
    return {
      success: true,
      data: {
        servers: [
          {
            type: 'rest',
            port: 3001,
            status: 'running',
            uptime: '2h 15m',
            requests: 1542,
          },
          {
            type: 'websocket',
            port: 3002,
            status: 'running',
            connections: 5,
          },
        ],
        totalRequests: 1542,
        activeConnections: 5,
      },
    }
  }
}