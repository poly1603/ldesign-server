import { Injectable } from '@nestjs/common'

/**
 * 应用配置接口
 */
export interface AppConfig {
  /** 服务端口 */
  port: number
  /** 环境模式 */
  nodeEnv: 'development' | 'production' | 'test'
  /** API 前缀 */
  apiPrefix: string
  /** 数据库路径 */
  databasePath: string
  /** CORS 配置 */
  cors: {
    origin: string | string[] | boolean
    credentials: boolean
  }
  /** Swagger 配置 */
  swagger: {
    enabled: boolean
    title: string
    description: string
    version: string
    path: string
  }
  /** 日志配置 */
  logging: {
    level: 'error' | 'warn' | 'log' | 'debug' | 'verbose'
    timestamp: boolean
  }
}

/**
 * 配置服务
 * 统一管理应用配置和环境变量
 */
@Injectable()
export class ConfigService {
  private readonly config: AppConfig

  constructor() {
    this.config = this.loadConfig()
    this.validateConfig()
  }

  /**
   * 加载配置
   * @returns 应用配置对象
   */
  private loadConfig(): AppConfig {
    return {
      port: this.getNumber('PORT', 3000),
      nodeEnv: this.getEnv('NODE_ENV', 'development') as AppConfig['nodeEnv'],
      apiPrefix: this.getString('API_PREFIX', 'api'),
      databasePath: this.getString('DATABASE_PATH', 'ldesign-server.db'),
      cors: {
        origin: this.getBoolean('CORS_ORIGIN', true),
        credentials: this.getBoolean('CORS_CREDENTIALS', true),
      },
      swagger: {
        enabled: this.getBoolean('SWAGGER_ENABLED', true),
        title: this.getString('SWAGGER_TITLE', 'LDesign Server API'),
        description: this.getString(
          'SWAGGER_DESCRIPTION',
          'LDesign 后台接口服务 - 提供 Node 版本管理、Git 环境检测、项目管理等功能',
        ),
        version: this.getString('SWAGGER_VERSION', '1.0.0'),
        path: this.getString('SWAGGER_PATH', 'api-docs'),
      },
      logging: {
        level: this.getEnv(
          'LOG_LEVEL',
          'log',
        ) as AppConfig['logging']['level'],
        timestamp: this.getBoolean('LOG_TIMESTAMP', true),
      },
    }
  }

  /**
   * 验证配置
   * @throws 如果配置无效则抛出错误
   */
  private validateConfig(): void {
    if (this.config.port < 1 || this.config.port > 65535) {
      throw new Error(`端口号必须在 1-65535 之间，当前值: ${this.config.port}`)
    }

    if (
      !['development', 'production', 'test'].includes(this.config.nodeEnv)
    ) {
      throw new Error(
        `NODE_ENV 必须是 development、production 或 test，当前值: ${this.config.nodeEnv}`,
      )
    }
  }

  /**
   * 获取字符串环境变量
   * @param key - 环境变量键
   * @param defaultValue - 默认值
   * @returns 环境变量值或默认值
   */
  private getString(key: string, defaultValue: string): string {
    const value = process.env[key]
    return value !== undefined ? value : defaultValue
  }

  /**
   * 获取数字环境变量
   * @param key - 环境变量键
   * @param defaultValue - 默认值
   * @returns 环境变量值或默认值
   */
  private getNumber(key: string, defaultValue: number): number {
    const value = process.env[key]
    if (value === undefined) {
      return defaultValue
    }
    const parsed = Number.parseInt(value, 10)
    if (Number.isNaN(parsed)) {
      return defaultValue
    }
    return parsed
  }

  /**
   * 获取布尔环境变量
   * @param key - 环境变量键
   * @param defaultValue - 默认值
   * @returns 环境变量值或默认值
   */
  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key]
    if (value === undefined) {
      return defaultValue
    }
    return value.toLowerCase() === 'true' || value === '1'
  }

  /**
   * 获取环境变量
   * @param key - 环境变量键
   * @param defaultValue - 默认值
   * @returns 环境变量值或默认值
   */
  private getEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue
  }

  /**
   * 获取配置对象
   * @returns 应用配置
   */
  getConfig(): AppConfig {
    return this.config
  }

  /**
   * 获取服务端口
   * @returns 端口号
   */
  getPort(): number {
    return this.config.port
  }

  /**
   * 获取环境模式
   * @returns 环境模式
   */
  getNodeEnv(): string {
    return this.config.nodeEnv
  }

  /**
   * 是否为开发环境
   * @returns 是否为开发环境
   */
  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development'
  }

  /**
   * 是否为生产环境
   * @returns 是否为生产环境
   */
  isProduction(): boolean {
    return this.config.nodeEnv === 'production'
  }

  /**
   * 获取 API 前缀
   * @returns API 前缀
   */
  getApiPrefix(): string {
    return this.config.apiPrefix
  }

  /**
   * 获取数据库路径
   * @returns 数据库路径
   */
  getDatabasePath(): string {
    return this.config.databasePath
  }

  /**
   * 获取 CORS 配置
   * @returns CORS 配置
   */
  getCorsConfig() {
    return this.config.cors
  }

  /**
   * 获取 Swagger 配置
   * @returns Swagger 配置
   */
  getSwaggerConfig() {
    return this.config.swagger
  }

  /**
   * 获取日志配置
   * @returns 日志配置
   */
  getLoggingConfig() {
    return this.config.logging
  }
}
