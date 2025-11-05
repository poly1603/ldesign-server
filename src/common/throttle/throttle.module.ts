import { Module } from '@nestjs/common'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '../../config/config.module.js'
import { ConfigService } from '../../config/config.service.js'

/**
 * 限流模块
 * 防止 API 被滥用
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [{
        // 默认限流配置
        ttl: 60000, // 60 秒时间窗口
        limit: configService.isProduction() ? 100 : 1000, // 生产环境限制更严格
        
        // 可以为不同的端点设置不同的限流策略
        skipIf: (context) => {
          // 健康检查端点不限流
          const request = context.switchToHttp().getRequest()
          return request.url === '/api/health'
        },
      }],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class ThrottleModule {}