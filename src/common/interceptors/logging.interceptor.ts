import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // 获取用户信息（如果已认证）
    const user = (request as any).user;
    const userId = user ? user.id : 'anonymous';
    const username = user ? user.username : 'anonymous';

    // 记录请求开始
    this.logger.log(
      `[${method}] ${url} - ${ip} - ${userAgent} - User: ${username}(${userId}) - Start`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const { statusCode } = response;

          // 记录成功响应
          this.logger.log(
            `[${method}] ${url} - ${statusCode} - ${duration}ms - User: ${username}(${userId}) - Success`,
          );

          // 记录详细的请求信息（仅在开发环境）
          if (process.env.NODE_ENV === 'development') {
            this.logger.debug(
              `Request Details: ${JSON.stringify({
                method,
                url,
                ip,
                userAgent,
                userId,
                username,
                statusCode,
                duration,
                requestBody: this.sanitizeBody(request.body),
                queryParams: request.query,
              })}`,
            );
          }
        },
        error: (error) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          const statusCode = error.status || 500;

          // 记录错误响应
          this.logger.error(
            `[${method}] ${url} - ${statusCode} - ${duration}ms - User: ${username}(${userId}) - Error: ${error.message}`,
            error.stack,
          );
        },
      }),
    );
  }

  /**
   * 清理敏感信息
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }
}