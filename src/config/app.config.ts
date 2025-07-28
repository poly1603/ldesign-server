import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'LDesign API Server',
  port: parseInt(process.env.APP_PORT || '3000', 10),
  env: process.env.APP_ENV || 'development',
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  
  // 限流配置
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
  },
  
  // 文件上传配置
  upload: {
    dest: process.env.UPLOAD_DEST || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
  },
  
  // 邮件配置
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    from: process.env.MAIL_FROM || 'noreply@ldesign.com',
  },
  
  // Swagger配置
  swagger: {
    title: process.env.SWAGGER_TITLE || 'LDesign API Documentation',
    description: process.env.SWAGGER_DESCRIPTION || '企业级后端API管理系统',
    version: process.env.SWAGGER_VERSION || '1.0.0',
    path: process.env.SWAGGER_PATH || 'api-docs',
  },
  
  // 安全配置
  security: {
    bcryptRounds: 12,
    passwordMinLength: 6,
    passwordMaxLength: 128,
    usernameMinLength: 3,
    usernameMaxLength: 50,
    emailVerificationRequired: false,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15分钟
  },
  
  // 分页配置
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
  },
}));