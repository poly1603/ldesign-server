import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // 获取配置
  const port = configService.get<number>('app.port', 3000);
  const corsOrigin = configService.get<string[]>('app.cors.origin');
  const swaggerConfig = configService.get('app.swagger');

  // 启用CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 设置全局前缀
  app.setGlobalPrefix('api/v1');

  // 配置Swagger文档
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle(swaggerConfig.title)
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('认证管理', '用户认证相关接口')
      .addTag('用户管理', '用户信息管理接口')
      .addTag('角色管理', '角色权限管理接口')
      .addTag('权限管理', '权限配置管理接口')
      .addTag('菜单管理', '系统菜单管理接口')
      .addTag('系统管理', '系统配置管理接口')
      .addTag('应用信息', '应用基础信息接口')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerConfig.path, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`Swagger documentation available at: http://localhost:${port}/${swaggerConfig.path}`);
  }

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
