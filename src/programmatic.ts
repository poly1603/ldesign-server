/**
 * 可编程调用的服务器接口
 * 用于在 CLI 或其他工具中直接启动服务器
 */

import { App, type AppConfig } from './app'
import { logger } from './utils/logger'
import type { Server as HttpServer } from 'http'

export interface ServerOptions {
  port?: number
  host?: string
  corsOrigins?: string[]
  enableWebSocket?: boolean
  silent?: boolean
}

export interface ServerInstance {
  app: App
  stop: () => Promise<void>
  getHttpServer: () => HttpServer
  getPort: () => number
  getHost: () => string
}

/**
 * 启动开发模式服务器
 * - 支持热重载（通过 tsx watch 实现）
 * - 详细日志输出
 * - 开发友好的错误提示
 */
export async function startDevServer(options: ServerOptions = {}): Promise<ServerInstance> {
  const config: AppConfig = {
    port: options.port ?? Number.parseInt(process.env.PORT || '3000', 10),
    host: options.host ?? process.env.HOST ?? '127.0.0.1',
    corsOrigins: options.corsOrigins ?? process.env.CORS_ORIGINS?.split(',') ?? [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    enableWebSocket: options.enableWebSocket ?? process.env.ENABLE_WS !== 'false',
    mode: 'dev', // 开发模式
    webUrl: 'http://localhost:5173', // 开发模式前端地址
  }

  if (!options.silent) {
    logger.info('🚀 启动开发模式服务器...')
    logger.info(`📍 配置: ${JSON.stringify(config, null, 2)}`)
  }

  const app = new App(config)
  await app.start()

  if (!options.silent) {
    logger.success('✅ 开发服务器启动成功')
  }

  return {
    app,
    stop: async () => {
      if (!options.silent) {
        logger.info('🛑 正在停止服务器...')
      }
      await app.stop()
      if (!options.silent) {
        logger.success('✅ 服务器已停止')
      }
    },
    getHttpServer: () => app.getServer(),
    getPort: () => config.port,
    getHost: () => config.host,
  }
}

/**
 * 启动生产模式服务器
 * - 使用构建后的代码
 * - 优化的性能配置
 * - 简洁的日志输出
 */
export async function startProdServer(options: ServerOptions = {}): Promise<ServerInstance> {
  const config: AppConfig = {
    port: options.port ?? Number.parseInt(process.env.PORT || '3000', 10),
    host: options.host ?? process.env.HOST ?? '0.0.0.0',
    corsOrigins: options.corsOrigins ?? process.env.CORS_ORIGINS?.split(',') ?? ['*'],
    enableWebSocket: options.enableWebSocket ?? process.env.ENABLE_WS !== 'false',
    mode: 'prod', // 生产模式
  }

  if (!options.silent) {
    logger.info('🚀 启动生产模式服务器...')
  }

  const app = new App(config)
  await app.start()

  if (!options.silent) {
    logger.success('✅ 生产服务器启动成功')
  }

  return {
    app,
    stop: async () => {
      if (!options.silent) {
        logger.info('🛑 正在停止服务器...')
      }
      await app.stop()
      if (!options.silent) {
        logger.success('✅ 服务器已停止')
      }
    },
    getHttpServer: () => app.getServer(),
    getPort: () => config.port,
    getHost: () => config.host,
  }
}

/**
 * 通用启动函数
 * 根据环境变量或参数决定启动模式
 */
export async function startServer(options: ServerOptions & { mode?: 'dev' | 'prod' } = {}): Promise<ServerInstance> {
  const mode = options.mode ?? (process.env.NODE_ENV === 'production' ? 'prod' : 'dev')
  
  if (mode === 'prod') {
    return startProdServer(options)
  } else {
    return startDevServer(options)
  }
}

