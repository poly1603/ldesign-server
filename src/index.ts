/**
 * Server 可编程接口
 * 供 CLI 和 Nexus 等外部程序调用
 */

import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module.js'
import { ConfigService } from './config/config.service.js'
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js'
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js'

export interface ServerOptions {
  port?: number
  host?: string
  corsOrigins?: string[]
  enableWebSocket?: boolean
  enableSwagger?: boolean
  silent?: boolean
}

export interface ServerInstance {
  app: INestApplication
  port: number
  host: string
  stop: () => Promise<void>
  getUrl: () => string
}

/**
 * 创建并配置 NestJS 应用实例
 */
async function createServerApp(options: ServerOptions = {}): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    logger: options.silent ? false : ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  // 获取配置服务
  const configService = app.get(ConfigService)

  // 设置全局前缀
  app.setGlobalPrefix(configService.getApiPrefix())

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter())

  // 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor())

  // CORS 配置
  const corsConfig = configService.getCorsConfig()
  app.enableCors({
    origin: options.corsOrigins || corsConfig.origin,
    credentials: corsConfig.credentials,
  })

  return app
}

/**
 * 启动开发服务器
 */
export async function startDevServer(options: ServerOptions = {}): Promise<ServerInstance> {
  const port = options.port || 3001
  const host = options.host || '0.0.0.0'

  // 设置环境变量
  process.env.NODE_ENV = 'development'
  process.env.PORT = port.toString()

  const app = await createServerApp(options)

  await app.listen(port)

  if (!options.silent) {
    console.log(`🚀 Dev Server started at http://${host}:${port}`)
  }

  return {
    app,
    port,
    host,
    stop: async () => {
      await app.close()
    },
    getUrl: () => `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`,
  }
}

/**
 * 启动生产服务器
 */
export async function startProdServer(options: ServerOptions = {}): Promise<ServerInstance> {
  const port = options.port || 3001
  const host = options.host || '0.0.0.0'

  // 设置环境变量
  process.env.NODE_ENV = 'production'
  process.env.PORT = port.toString()

  const app = await createServerApp(options)

  await app.listen(port)

  if (!options.silent) {
    console.log(`🚀 Production Server started at http://${host}:${port}`)
  }

  return {
    app,
    port,
    host,
    stop: async () => {
      await app.close()
    },
    getUrl: () => `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`,
  }
}

/**
 * 检查服务器健康状态
 */
export async function checkServerHealth(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/api/health`)
    return response.ok
  } catch {
    return false
  }
}

// 导出类型
export * from './modules/project/entities/project.entity.js'
export * from './modules/project/dto/create-project.dto.js'
export * from './modules/project/dto/update-project.dto.js'
export * from './modules/project/dto/import-project.dto.js'
export * from './modules/node/dto/install-node.dto.js'
export * from './modules/node/dto/switch-node.dto.js'
export * from './modules/node/dto/install-manager.dto.js'
