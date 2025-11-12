import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as path from 'path';

/**
 * 日志配置
 */
export class LoggerConfig {
  /**
   * 创建 Winston 日志配置
   */
  static createWinstonConfig() {
    const logsDir = path.join(process.cwd(), 'logs');
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';

    // 日志格式
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    // 控制台格式（开发环境使用彩色输出）
    const consoleFormat = isDevelopment
      ? winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.ms(),
          nestWinstonModuleUtilities.format.nestLike('NestJS', {
            colors: true,
            prettyPrint: true,
          }),
        )
      : logFormat;

    // 通用日志传输（所有级别）
    const allLogsTransport: DailyRotateFile = new DailyRotateFile({
      dirname: logsDir,
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true, // 压缩归档的日志
      maxSize: '20m', // 单个文件最大 20MB
      maxFiles: '14d', // 保留 14 天
      format: logFormat,
      level: 'debug',
    });

    // 错误日志传输（仅 error 级别）
    const errorLogsTransport: DailyRotateFile = new DailyRotateFile({
      dirname: path.join(logsDir, 'errors'),
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d', // 错误日志保留 30 天
      format: logFormat,
      level: 'error',
    });

    // 警告日志传输（warn 及以上级别）
    const warnLogsTransport: DailyRotateFile = new DailyRotateFile({
      dirname: path.join(logsDir, 'warnings'),
      filename: 'warn-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat,
      level: 'warn',
    });

    const transports: any[] = [
      // 控制台输出
      new winston.transports.Console({
        format: consoleFormat,
        level: isDevelopment ? 'debug' : 'info',
      }),
      // 文件输出
      allLogsTransport,
      errorLogsTransport,
      warnLogsTransport,
    ];

    return {
      level: isDevelopment ? 'debug' : 'info',
      format: logFormat,
      transports,
      exceptionHandlers: [
        // 未捕获的异常
        new DailyRotateFile({
          dirname: path.join(logsDir, 'exceptions'),
          filename: 'exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          format: logFormat,
        }),
      ],
      rejectionHandlers: [
        // 未处理的 Promise rejection
        new DailyRotateFile({
          dirname: path.join(logsDir, 'rejections'),
          filename: 'rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          format: logFormat,
        }),
      ],
    };
  }
}
