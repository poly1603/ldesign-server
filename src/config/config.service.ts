import { Injectable } from '@nestjs/common'

/**
 * API Operation
 */
export interface AppConfig {
  /**
 * API Operation
 */
  port: number
  /**
 * API Operation
 */
  nodeEnv: 'development' | 'production' | 'test'
  /**
 * API Operation
 */
  apiPrefix: string
  /**
 * API Operation
 */
  databasePath: string
  /**
 * API Operation
 */
  cors: {
    origin: string | string[] | boolean
    credentials: boolean
  }
  /**
 * API Operation
 */
  swagger: {
    enabled: boolean
    title: string
    description: string
    version: string
    path: string
  }
  /**
 * API Operation
 */
  logging: {
    level: 'error' | 'warn' | 'log' | 'debug' | 'verbose'
    timestamp: boolean
  }
}

/**
 * API Operation
 */
@Injectable()
export class ConfigService {
  private readonly config: AppConfig

  constructor() {
    this.config = this.loadConfig()
    this.validateConfig()
  }

  /**
 * API Operation
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
          'LDesign  -  Node Git ',
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
 * API Operation
 */
  private validateConfig(): void {
    if (this.config.port < 1 || this.config.port > 65535) {
      throw new Error(` 1-65535 : ${this.config.port}`)
    }

    if (
      !['development', 'production', 'test'].includes(this.config.nodeEnv)
    ) {
      throw new Error(
        `NODE_ENV  developmentproduction  test: ${this.config.nodeEnv}`,
      )
    }
  }

  /**
 * API Operation
 */
  private getString(key: string, defaultValue: string): string {
    const value = process.env[key]
    return value !== undefined ? value : defaultValue
  }

  /**
 * API Operation
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
 * API Operation
 */
  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key]
    if (value === undefined) {
      return defaultValue
    }
    return value.toLowerCase() === 'true' || value === '1'
  }

  /**
 * API Operation
 */
  private getEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue
  }

  /**
 * API Operation
 */
  getConfig(): AppConfig {
    return this.config
  }

  /**
 * API Operation
 */
  getPort(): number {
    return this.config.port
  }

  /**
 * API Operation
 */
  getNodeEnv(): string {
    return this.config.nodeEnv
  }

  /**
 * API Operation
 */
  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development'
  }

  /**
 * API Operation
 */
  isProduction(): boolean {
    return this.config.nodeEnv === 'production'
  }

  /**
 * API Operation
 */
  getApiPrefix(): string {
    return this.config.apiPrefix
  }

  /**
 * API Operation
 */
  getDatabasePath(): string {
    return this.config.databasePath
  }

  /**
 * API Operation
 */
  getCorsConfig() {
    return this.config.cors
  }

  /**
 * API Operation
 */
  getSwaggerConfig() {
    return this.config.swagger
  }

  /**
 * API Operation
 */
  getLoggingConfig() {
    return this.config.logging
  }
}







