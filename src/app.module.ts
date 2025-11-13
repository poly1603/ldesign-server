import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { LoggerModule } from './logger/logger.module';
import { SystemModule } from './system/system.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true, // 全局可用
      load: [configuration], // 加载配置
      envFilePath: ['.env.local', '.env'], // 环境变量文件
    }),
    // 数据库配置
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/ldesign.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // 开发环境自动同步，生产环境应设为false
    }),
    // 日志模块（全局）
    LoggerModule,
    // 功能模块
    SystemModule,
    HealthModule,
    UsersModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HttpExceptionFilter,
    LoggingInterceptor,
  ],
})
export class AppModule {}
