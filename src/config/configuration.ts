/**
 * 应用配置
 */
export default () => ({
  // 应用基础配置
  app: {
    name: process.env.APP_NAME || 'NestJS API Server',
    version: process.env.APP_VERSION || '1.0.0',
    description:
      process.env.APP_DESCRIPTION ||
      'A robust NestJS API server with best practices',
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
  },

  // API 配置
  api: {
    prefix: process.env.API_PREFIX || 'api',
    version: process.env.API_VERSION || 'v1',
  },

  // Swagger 文档配置
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true' || true,
    path: process.env.SWAGGER_PATH || 'api-docs',
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
  },
});
