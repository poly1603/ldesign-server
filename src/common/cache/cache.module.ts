import { Module, Global } from '@nestjs/common'
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager'
import { ConfigModule } from '../../config/config.module.js'
import { ConfigService } from '../../config/config.service.js'
import { CacheService } from './cache.service.js'

/**
 * 全局缓存模块
 * 提供内存缓存和 Redis 缓存支持
 */
@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const isProduction = configService.isProduction()
        
        // 生产环境可以使用 Redis，开发环境使用内存缓存
        if (isProduction && process.env.REDIS_URL) {
          // 如果配置了 Redis，使用 Redis 缓存
          // 需要额外安装 cache-manager-redis-yet
          return {
            store: 'memory', // 暂时使用内存，后续可改为 redis
            ttl: 300, // 5 分钟默认 TTL
            max: 100, // 最多缓存 100 个 keys
          }
        }
        
        // 默认使用内存缓存
        return {
          store: 'memory',
          ttl: 60, // 1 分钟默认 TTL（开发环境较短）
          max: 100, // 最多缓存 100 个 keys
        }
      },
    }),
  ],
  providers: [CacheService],
  exports: [NestCacheModule, CacheService],
})
export class CacheModule {}