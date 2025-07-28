import { registerAs } from '@nestjs/config';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

export default registerAs(
  'redis',
  (): CacheModuleOptions => {
    // 如果有REDIS_URL环境变量（如Upstash），直接使用
    if (process.env.REDIS_URL) {
      return {
        store: redisStore as any,
        url: process.env.REDIS_URL,
        ttl: 60 * 60 * 24, // 24小时
        max: 1000, // 最大缓存数量
      };
    }

    // 否则使用传统的host/port配置
    return {
      store: redisStore as any,
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      ttl: 60 * 60 * 24, // 24小时
      max: 1000, // 最大缓存数量
      // 连接选项
      connectTimeout: 10000,
      lazyConnect: true,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
    };
  },
);

// Redis客户端配置（用于直接操作Redis）
export const redisClientConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryDelayOnFailover: 100,
  enableOfflineQueue: false,
  connectTimeout: 10000,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
};