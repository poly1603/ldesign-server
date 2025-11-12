import { Injectable, Inject, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

/**
 * 日志服务
 * 封装 Winston 日志功能，提供统一的日志接口
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * 记录常规日志
   */
  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  /**
   * 记录错误日志
   */
  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  /**
   * 记录警告日志
   */
  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  /**
   * 记录调试日志
   */
  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  /**
   * 记录详细日志
   */
  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }

  /**
   * 记录 HTTP 请求
   */
  logRequest(method: string, url: string, statusCode: number, duration: number, ip?: string) {
    this.logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ip,
      context: 'HttpRequest',
    });
  }

  /**
   * 记录 HTTP 错误
   */
  logError(
    method: string,
    url: string,
    statusCode: number,
    message: string,
    stack?: string,
    ip?: string,
  ) {
    this.logger.error('HTTP Error', {
      method,
      url,
      statusCode,
      message,
      stack,
      ip,
      context: 'HttpError',
    });
  }

  /**
   * 记录业务错误
   */
  logBusinessError(errorCode: number, message: string, details?: any) {
    this.logger.warn('Business Error', {
      errorCode,
      message,
      details,
      context: 'BusinessError',
    });
  }

  /**
   * 记录系统事件
   */
  logSystemEvent(event: string, details?: any) {
    this.logger.info('System Event', {
      event,
      details,
      context: 'SystemEvent',
    });
  }
}
