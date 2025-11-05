import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import compression from 'compression'
import { AppModule } from './app.module.js'
import { ConfigService } from './config/config.service.js'
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js'
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js'
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor.js'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * 杀掉占用指定端口的进程
 * @param port - 端口号
 */
async function killPortProcess(port: number): Promise<void> {
  if (process.platform === 'win32') {
    // Windows 平台
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
    const lines = stdout.split('\n').filter(line => line.includes('LISTENING'))
    
    if (lines.length > 0) {
      const match = lines[0].match(/\s+(\d+)\s*$/)
      if (match) {
        const pid = match[1]
        await execAsync(`taskkill /F /PID ${pid}`)
        // 等待进程完全终止
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  } else {
    // Unix/Linux/Mac 平台
    const { stdout } = await execAsync(`lsof -ti:${port}`)
    const pid = stdout.trim()
    if (pid) {
      await execAsync(`kill -9 ${pid}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

/**
 * 启动 NestJS 应用
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn', 'log'] 
      : ['error', 'warn', 'log', 'debug', 'verbose'],
    // 禁用 NestJS 默认的 body parser，使用自定义配置
    rawBody: true,
  })

  // 获取配置服务
  const configService = app.get(ConfigService)
  const swaggerConfig = configService.getSwaggerConfig()
  const corsConfig = configService.getCorsConfig()
  const apiPrefix = configService.getApiPrefix()

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

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter())

  // Global interceptors (order matters: logging -> timeout -> transform)
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(30000), // 30 seconds timeout
    new TransformInterceptor(),
  )

  // 启用压缩中间件
  app.use(compression({
    threshold: 1024, // 只压缩大于 1KB 的响应
    level: 6, // 压缩级别 (0-9)，6 是默认值
    filter: (req, res) => {
      // 不压缩 WebSocket 和已压缩的内容
      if (req.headers['x-no-compression']) {
        return false
      }
      return compression.filter(req, res)
    },
  }))

  // CORS 配置
  app.enableCors(corsConfig)

  // 全局前缀（在 Swagger 配置之前设置，但排除 Swagger 路径）
  app.setGlobalPrefix(apiPrefix, {
    exclude: [swaggerConfig.path, `${swaggerConfig.path}-json`],
  })

  // Swagger 文档配置
  if (swaggerConfig.enabled) {
    try {
      logger.log('开始初始化 Swagger 文档...')
      
      const config = new DocumentBuilder()
        .setTitle(swaggerConfig.title)
        .setDescription(swaggerConfig.description)
        .setVersion(swaggerConfig.version)
        .addTag('health', 'Health Check')
        .addTag('node', 'Node Version Management')
        .addTag('git', 'Git Management')
        .addTag('projects', 'Project Management')
        .addTag('system', 'System Utilities')
        .addTag('logs', 'Log Management')
        .addTag('builder', 'Builder Management')
        .addTag('changelog', 'Changelog Management')
        .addTag('deps', 'Dependencies Management')
        .addTag('generator', 'Code Generator')
    .addTag('security', 'Security Management')
    .addTag('testing', 'Testing Tools')
    .addTag('deployer', 'Deployment Management')
    .addTag('docs-generator', 'Documentation Generation')
    .addTag('env', 'Environment Variables Management')
    .addTag('formatter', 'Code Formatting and Linting')
    .addTag('mock', 'Mock Data Generation')
    .addTag('monitor', 'Monitoring and Observability')
    .addTag('publisher', 'Package Publishing')
    .addTag('performance', 'Performance testing and optimization')
    .addTag('launcher', 'Application launcher and process management')
    .addTag('translator', 'Translation and internationalization')
    .addTag('file-manager', 'File management operations')
    .addTag('scheduler', 'Task scheduling and cron jobs')
    .addTag('workflow', 'Workflow automation and orchestration')
    .addTag('notification', 'Notification and alerting system')
    .addTag('database', 'Database management and operations')
    .addTag('integration', 'Third-party integration (GitHub/GitLab/Docker/Jenkins)')
    .addTag('batch', 'Batch operations (create/update/delete/import/export)')
    .build()

      logger.log('Swagger 配置已创建，开始生成文档...')

      const document = SwaggerModule.createDocument(app, config, {
        operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
        deepScanRoutes: true,
      })
      
      logger.log('Swagger 文档已生成，开始设置路由...')
      
      // Swagger 路径设置为全局前缀之外的路径（不受 api 前缀影响）
      SwaggerModule.setup(swaggerConfig.path, app, document, {
        customSiteTitle: swaggerConfig.title,
        customfavIcon: '/favicon.ico',
        customCss: '.swagger-ui .topbar { display: none }',
        swaggerOptions: {
          persistAuthorization: true,
        },
      })

      logger.log(
        `📚 Swagger 文档已启用: http://localhost:${configService.getPort()}/${swaggerConfig.path}`,
      )
    } catch (error) {
      logger.error('Swagger 文档生成失败:')
      logger.error(error instanceof Error ? error.message : String(error))
      if (error instanceof Error && error.stack) {
        logger.error('错误堆栈:')
        logger.error(error.stack)
      }
      logger.warn('将继续启动应用，但 Swagger 文档不可用')
    }
  }

  // 获取配置的端口并尝试启动
  const configuredPort = configService.getPort()
  let port = configuredPort
  
  // 尝试启动应用，如果端口被占用则自动杀掉占用的进程或切换端口
  let attemptCount = 0
  const maxAttempts = 100
  
  while (attemptCount < maxAttempts) {
    try {
      await app.listen(port)
      break // 成功启动，跳出循环
    } catch (error: any) {
      // 如果启动失败且是端口占用错误
      if (error.code === 'EADDRINUSE') {
        attemptCount++
        
        // 第一次尝试：杀掉占用端口的进程
        if (attemptCount === 1 && port === configuredPort) {
          logger.warn(`端口 ${port} 已被占用，尝试终止占用进程...`)
          try {
            await killPortProcess(port)
            logger.log(`✓ 已终止占用端口 ${port} 的进程，重试启动...`)
            continue // 重试当前端口
          } catch (killError) {
            logger.warn(`无法终止占用进程，将尝试使用其他端口`)
          }
        }
        
        // 尝试下一个端口
        logger.warn(`端口 ${port} 仍被占用，尝试端口 ${port + 1}...`)
        port++
        
        if (port > 65535) {
          throw new Error(`无法找到可用端口，已尝试到端口 ${port - 1}`)
        }
        
        if (attemptCount >= maxAttempts) {
          throw new Error(`无法找到可用端口，已尝试 ${maxAttempts} 次`)
        }
      } else {
        // 其他错误直接抛出
        throw error
      }
    }
  }
  
  if (attemptCount > 0) {
    logger.log(`✓ 找到可用端口: ${port}`)
  }

  logger.log(`🚀 服务已启动: http://localhost:${port}/${configService.getApiPrefix()}`)
  logger.log(`📝 环境: ${configService.getNodeEnv()}`)
  if (port !== configuredPort) {
    logger.log(`⚠️  注意: 配置端口 ${configuredPort} 不可用，已使用端口 ${port}`)
  }
  
  if (swaggerConfig.enabled) {
    logger.log(`📖 API 文档: http://localhost:${port}/${swaggerConfig.path}`)
  }
}

bootstrap().catch((error) => {
  console.error('应用启动失败:', error)
  process.exit(1)
})
