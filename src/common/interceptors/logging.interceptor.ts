import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '../../logger/logger.service';

/**
 * 日志拦截器
 * 记录请求和响应信息
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, body, query, params } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // 记录请求开始
    this.logger.debug(
      `请求开始 - ${method} ${url} - IP: ${ip} - UA: ${userAgent}`,
      'HttpRequest',
    );

    // 记录请求参数（仅在 debug 模式）
    if (Object.keys(body || {}).length > 0) {
      this.logger.debug(
        `请求体: ${JSON.stringify(body)}`,
        'HttpRequest',
      );
    }

    if (Object.keys(query || {}).length > 0) {
      this.logger.debug(
        `查询参数: ${JSON.stringify(query)}`,
        'HttpRequest',
      );
    }

    if (Object.keys(params || {}).length > 0) {
      this.logger.debug(
        `路径参数: ${JSON.stringify(params)}`,
        'HttpRequest',
      );
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // 使用统一的请求日志格式
          this.logger.logRequest(method, url, statusCode, duration, ip);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `请求失败 - ${method} ${url} - 耗时: ${duration}ms - 错误: ${error.message}`,
            error.stack,
            'HttpRequest',
          );
        },
      }),
    );
  }
}
