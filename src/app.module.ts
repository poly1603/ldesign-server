import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './controllers/users.controller';
import { ArticlesController } from './controllers/articles.controller';
import { UsersService } from './services/users.service';
import { ArticlesService } from './services/articles.service';
import { CaptchaModule } from './auth/captcha.module';
import { appConfig, databaseConfig, redisConfig, jwtConfig } from './config';
import { JwtAuthGuard, PermissionsGuard } from './common/guards';
import { AllExceptionsFilter } from './common/filters';
import { TransformInterceptor, LoggingInterceptor } from './common/interceptors';
import { Reflector } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { MenusModule } from './menus/menus.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    
    // 数据库模块 (暂时禁用，先让项目运行起来)
    // TypeOrmModule.forRootAsync({
    //   useFactory: (configService: ConfigService) => configService.get('database') || {},
    //   inject: [ConfigService],
    // }),
    
    // 缓存模块 (内存缓存 - 临时方案)
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 60 * 24, // 24小时
      max: 1000, // 最大缓存数量
    }),
    
    // 限流模块
    ThrottlerModule.forRootAsync({
      useFactory: (configService: ConfigService) => [{
        ttl: configService.get('app.rateLimit.ttl') || 60,
        limit: configService.get('app.rateLimit.limit') || 100,
      }],
      inject: [ConfigService],
    }),
    
    // 业务模块
    CaptchaModule,
    // UsersModule,
    // RolesModule,
    // PermissionsModule,
    // MenusModule,
    // SystemModule,
  ],
  controllers: [AppController, UsersController, ArticlesController],
  providers: [
    AppService,
    UsersService,
    ArticlesService,
    // 全局守卫
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    // 全局过滤器
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // 全局拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => new TransformInterceptor(reflector),
      inject: [Reflector],
    },
  ],
})
export class AppModule {}
