import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { ConfigService } from './config/config.service'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

/**
 * 启动 NestJS 应用
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  // 获取配置服务
  const configService = app.get(ConfigService)
  const swaggerConfig = configService.getSwaggerConfig()
  const corsConfig = configService.getCorsConfig()

  // 全局前缀
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
  app.enableCors(corsConfig)

  // Swagger 文档配置
  if (swaggerConfig.enabled) {
    const config = new DocumentBuilder()
      .setTitle(swaggerConfig.title)
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version)
      .addTag('health', '健康检查')
      .addTag('node', 'Node 版本管理')
      .addTag('git', 'Git 管理')
      .addTag('project', '项目管理')
      .addTag('system', '系统工具')
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup(swaggerConfig.path, app, document, {
      customSiteTitle: swaggerConfig.title,
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
    })

    logger.log(
      `📚 Swagger 文档已启用: http://localhost:${configService.getPort()}/${swaggerConfig.path}`,
    )
  }

  const port = configService.getPort()
  await app.listen(port)

  logger.log(`🚀 服务已启动: http://localhost:${port}/${configService.getApiPrefix()}`)
  logger.log(`📝 环境: ${configService.getNodeEnv()}`)
}

bootstrap().catch((error) => {
  console.error('应用启动失败:', error)
  process.exit(1)
})
