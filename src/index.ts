import { App } from './app'
import { logger } from './utils/logger'

const config = {
  port: Number.parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '127.0.0.1',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:5173'],
  enableWebSocket: process.env.ENABLE_WS !== 'false',
}

const app = new App(config)

// 启动服务器
app.start().catch((error) => {
  logger.error('服务器启动失败', error)
  process.exit(1)
})

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信号，正在关闭服务器...')
  await app.stop()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('收到 SIGINT 信号，正在关闭服务器...')
  await app.stop()
  process.exit(0)
})

// 错误处理
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的 Promise 拒绝', { reason, promise })
  process.exit(1)
})

// 导出应用实例（用于直接运行）
export { app }

// 导出类型
export * from './types'

// 导出可编程接口（用于 CLI 等工具调用）
export { startDevServer, startProdServer, startServer } from './programmatic'
export type { ServerOptions, ServerInstance } from './programmatic'

// 导出 App 类（用于高级自定义）
export { App } from './app'
export type { AppConfig } from './app'
