import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import path from 'path'
import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createServer, type Server as HttpServer } from 'http'
import { WebSocketServer, type WebSocket } from 'ws'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger } from './middleware/requestLogger'
import { setupRoutes } from './routes'
import { db } from './database'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface AppConfig {
  port: number
  host: string
  corsOrigins?: string[]
  enableWebSocket?: boolean
  mode?: 'dev' | 'prod' // 新增：运行模式
  webUrl?: string // 新增：开发模式下的前端地址
}

export class App {
  private app: Express
  private server: HttpServer
  private wss?: WebSocketServer
  private config: AppConfig
  private clients: Set<WebSocket> = new Set()

  constructor(config: AppConfig) {
    this.config = config
    this.app = express()
    this.server = createServer(this.app)
    
    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
    
    if (config.enableWebSocket) {
      this.setupWebSocket()
    }
  }

  private setupMiddleware() {
    // CORS
    this.app.use(cors({
      origin: this.config.corsOrigins || ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    }))

    // Body 解析
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

    // 请求日志
    this.app.use(requestLogger)
  }

  private setupRoutes() {
    // API 路由
    setupRoutes(this.app)

    // 根路径处理
    this.app.get('/', (req: Request, res: Response) => {
      const mode = this.config.mode || 'prod'
      
      if (mode === 'dev') {
        // 开发模式：提示访问开发服务器
        res.json({
          message: 'LDesign API Server',
          mode: 'development',
          api: `http://${this.config.host}:${this.config.port}/api`,
          docs: `http://${this.config.host}:${this.config.port}/api-docs`,
          ui: this.config.webUrl || 'http://localhost:5173',
        })
      } else {
        // 生产模式：重定向到 UI
        res.redirect('/ui')
      }
    })

    // 静态文件服务（仅生产模式）
    const mode = this.config.mode || 'prod'
    if (mode === 'prod') {
      // 优先使用 public 目录（web 构建后会同步到这里）
      // 回退到 ../web/dist（兼容直接运行开发版本）
      const publicPath = path.join(__dirname, '..', 'public')
      const webDistPath = path.join(__dirname, '..', '..', 'web', 'dist')
      const staticPath = existsSync(publicPath) ? publicPath : webDistPath
      
      this.app.use('/ui', express.static(staticPath))

      // SPA 支持：/ui 路径下的所有未匹配路由返回 index.html
      this.app.get('/ui/*', (req: Request, res: Response) => {
        res.sendFile(path.join(staticPath, 'index.html'))
      })
      
      logger.info(`📁 静态文件服务: ${staticPath}`)
    }
  }

  private setupErrorHandling() {
    this.app.use(errorHandler)
  }

  private setupWebSocket() {
    this.wss = new WebSocketServer({ 
      server: this.server,
      path: '/ws',
    })

    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('WebSocket 客户端已连接')
      this.clients.add(ws)

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleWebSocketMessage(ws, message)
        } catch (error) {
          logger.error('WebSocket 消息解析失败', error)
        }
      })

      ws.on('close', () => {
        logger.info('WebSocket 客户端已断开')
        this.clients.delete(ws)
      })

      ws.on('error', (error) => {
        logger.error('WebSocket 错误', error)
        this.clients.delete(ws)
      })

      // 发送欢迎消息
      this.sendToClient(ws, {
        type: 'connected',
        data: { message: 'WebSocket 连接成功' },
      })
    })

    logger.info('WebSocket 服务器已启动')
  }

  private handleWebSocketMessage(ws: WebSocket, message: any) {
    logger.debug('收到 WebSocket 消息', message)

    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', data: { timestamp: Date.now() } })
        break
      case 'subscribe':
        // 订阅特定事件
        this.sendToClient(ws, { type: 'subscribed', data: message.data })
        break
      default:
        logger.warn('未知的 WebSocket 消息类型', message.type)
    }
  }

  public broadcast(message: any) {
    const data = JSON.stringify(message)
    this.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(data)
      }
    })
  }

  public sendToClient(client: WebSocket, message: any) {
    if (client.readyState === 1) { // OPEN
      client.send(JSON.stringify(message))
    }
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      // 初始化数据库
      db.initialize()

      this.server.listen(this.config.port, this.config.host, () => {
        logger.info(`🚀 服务器启动成功`)
        logger.info(`📍 HTTP: http://${this.config.host}:${this.config.port}`)
        if (this.config.enableWebSocket) {
          logger.info(`📍 WebSocket: ws://${this.config.host}:${this.config.port}/ws`)
        }
        resolve()
      })
    })
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      // 关闭 WebSocket
      if (this.wss) {
        this.clients.forEach(client => client.close())
        this.wss.close()
      }

      // 关闭 HTTP 服务器
      this.server.close(() => {
        logger.info('服务器已关闭')
        resolve()
      })
    })
  }

  public getApp(): Express {
    return this.app
  }

  public getServer(): HttpServer {
    return this.server
  }
}
