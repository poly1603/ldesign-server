import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller.js'
import { ConfigService } from './config/config.service.js'

describe('AppController', () => {
  let controller: AppController
  let configService: ConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            getNodeEnv: () => 'test',
            getPort: () => 3000,
            getApiPrefix: () => 'api',
          },
        },
      ],
    }).compile()

    controller = module.get<AppController>(AppController)
    configService = module.get<ConfigService>(ConfigService)
  })

  it('应该被定义', () => {
    expect(controller).toBeDefined()
  })

  describe('health', () => {
    it('应该返回健康状态', () => {
      const result = controller.health()

      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('data')
      expect(result.data).toHaveProperty('status', 'ok')
      expect(result.data).toHaveProperty('timestamp')
      expect(result.data).toHaveProperty('uptime')
      expect(result.data).toHaveProperty('system')
      expect(result.data.system).toHaveProperty('platform')
      expect(result.data.system).toHaveProperty('arch')
      expect(result.data.system).toHaveProperty('nodeVersion')
      expect(result.data.system).toHaveProperty('memory')
    })

    it('系统信息应该包含正确的结构', () => {
      const result = controller.health()

      expect(result.data.system.memory).toHaveProperty('total')
      expect(result.data.system.memory).toHaveProperty('free')
      expect(result.data.system.memory).toHaveProperty('used')
      expect(typeof result.data.system.memory.total).toBe('number')
      expect(typeof result.data.system.memory.free).toBe('number')
      expect(typeof result.data.system.memory.used).toBe('number')
    })
  })
})





















