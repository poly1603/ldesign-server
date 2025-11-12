import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * 日志拦截器
 * 记录请求和响应信息
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, body, query, params } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // 记录请求信息
    this.logger.log(
      `请求开始 - ${method} ${url} - IP: ${ip} - UA: ${userAgent}`,
    );

    if (Object.keys(body || {}).length > 0) {
      this.logger.debug(`请求体: ${JSON.stringify(body)}`);
    }

    if (Object.keys(query || {}).length > 0) {
      this.logger.debug(`查询参数: ${JSON.stringify(query)}`);
    }

    if (Object.keys(params || {}).length > 0) {
      this.logger.debug(`路径参数: ${JSON.stringify(params)}`);
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `请求完成 - ${method} ${url} - 耗时: ${duration}ms`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `请求失败 - ${method} ${url} - 耗时: ${duration}ms - 错误: ${error.message}`,
          );
        },
      }),
    );
  }
}
