import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // 缓冲日志
  });
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  
  // 使用自定义日志服务
  app.useLogger(logger);

  // 获取配置
  const port = configService.get('app.port', 3000);
  const apiPrefix = configService.get('api.prefix', 'api');
  const apiVersion = configService.get('api.version', 'v1');
  const swaggerEnabled = configService.get('swagger.enabled', true);
  const swaggerPath = configService.get('swagger.path', 'api-docs');
  const appName = configService.get('app.name', 'NestJS API Server');
  const appVersion = configService.get('app.version', '1.0.0');
  const appDescription = configService.get(
    'app.description',
    'A robust NestJS API server',
  );

  // 设置全局路径前缀
  app.setGlobalPrefix(`${apiPrefix}/${apiVersion}`);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换类型
      whitelist: true, // 过滤掉未定义的属性
      forbidNonWhitelisted: true, // 如果有未定义属性则抛出错误
      transformOptions: {
        enableImplicitConversion: true, // 启用隐式类型转换
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(app.get(HttpExceptionFilter));

  // 全局拦截器
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    app.get(LoggingInterceptor),
    new TransformInterceptor(reflector),
  );

  // 启用 CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 配置 Swagger 文档
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle(appName)
      .setDescription(appDescription)
      .setVersion(appVersion)
      .addBearerAuth() // 添加认证支持
      .addTag('system', '系统信息')
      .addTag('health', '健康检查')
      .addTag('users', '用户管理')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerPath, app, document, {
      customSiteTitle: appName,
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true, // 持久化认证信息
        docExpansion: 'none', // 默认折叠所有接口
        filter: true, // 显示搜索框
        showRequestDuration: true, // 显示请求耗时
      },
    });

    logger.log(
      `Swagger 文档已启用: http://localhost:${port}/${swaggerPath}`,
      'Bootstrap',
    );
  }

  await app.listen(port);
  
  // 记录启动信息
  logger.log(`应用启动成功，监听端口: ${port}`, 'Bootstrap');
  logger.log(`API 地址: http://localhost:${port}/${apiPrefix}/${apiVersion}`, 'Bootstrap');
  logger.logSystemEvent('Application Started', {
    port,
    environment: configService.get('app.env'),
    version: configService.get('app.version'),
  });
}

bootstrap();
