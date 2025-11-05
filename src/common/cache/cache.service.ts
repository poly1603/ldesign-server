import { Injectable, Inject, Logger } from '@nestjs/common'
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager'

/**
 * API Operation
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
 * API Operation
 */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key)
      if (value) {
        this.logger.debug(`Cache hit: ${key}`)
      }
      return value
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}:`, error)
      return undefined
    }
  }

  /**
 * API Operation
 */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl ? ttl * 1000 : undefined)
      this.logger.debug(`Cache set: ${key} (TTL: ${ttl || 'default'}s)`)
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}:`, error)
    }
  }

  /**
 * API Operation
 */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key)
      this.logger.debug(`Cache deleted: ${key}`)
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}:`, error)
    }
  }

  /**
 * API Operation
 */
  async reset(): Promise<void> {
    try {
      // Operation
      // Operation
      this.logger.log('Cache reset requested - manual implementation needed')
    } catch (error) {
      this.logger.error('Error resetting cache:', error)
    }
  }

  /**
 * API Operation
 */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Operation
    const cached = await this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    // Operation
    const result = await fn()

    // Operation
    await this.set(key, result, ttl)

    return result
  }

  /**
 * API Operation
 */
  async mget<T>(keys: string[]): Promise<(T | undefined)[]> {
    const results: (T | undefined)[] = []
    for (const key of keys) {
      const value = await this.get<T>(key)
      results.push(value)
    }
    return results
  }

  /**
 * API Operation
 */
  async mset(
    items: Array<{ key: string; value: any }>,
    ttl?: number,
  ): Promise<void> {
    for (const item of items) {
      await this.set(item.key, item.value, ttl)
    }
  }

  /**
 * API Operation
 */
  generateKey(prefix: string, ...params: any[]): string {
    const suffix = params
      .map((p) => (typeof p === 'object' ? JSON.stringify(p) : String(p)))
      .join(':')
    return `${prefix}:${suffix}`
  }

  /**
 * API Operation
 */
  async invalidatePattern(pattern: string): Promise<void> {
    this.logger.warn(`Pattern invalidation not supported in memory cache: ${pattern}`)
    // Operation
    // Operation
  }
}