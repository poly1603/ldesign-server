import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

/**
 * Logging Interceptor
 * Logs all HTTP requests and responses with timing information
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url, ip } = request
    const startTime = Date.now()

    // 只在开发环境记录详细请求信息
    if (process.env.NODE_ENV === 'development') {
      const { body, query, params } = request
      const userAgent = request.get('user-agent') || ''
      
      this.logger.log(`${method} ${url} - ${ip} ${userAgent}`)
      
      if (Object.keys(body || {}).length > 0) {
        this.logger.debug(`Request body: ${JSON.stringify(this.sanitizeBody(body))}`)
      }
      if (Object.keys(query || {}).length > 0) {
        this.logger.debug(`Query params: ${JSON.stringify(query)}`)
      }
      if (Object.keys(params || {}).length > 0) {
        this.logger.debug(`Route params: ${JSON.stringify(params)}`)
      }
    } else {
      // 生产环境只记录基本信息
      this.logger.log(`${method} ${url} - ${ip}`)
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse()
          const { statusCode } = response
          const duration = Date.now() - startTime

          this.logger.log(
            `${method} ${url} ${statusCode} ${duration}ms - ${ip}`,
          )
        },
        error: (error) => {
          const duration = Date.now() - startTime
          const statusCode = error?.status || 500
          const errorMessage = error?.message || 'Unknown error'

          this.logger.error(
            `${method} ${url} ${statusCode} ${duration}ms - ${ip} - Error: ${errorMessage}`,
          )
        },
      }),
    )
  }

  /**
   * Sanitize request body for logging
   * Removes sensitive information like passwords, tokens, etc.
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body
    }

    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'accessToken', 'refreshToken']
    const sanitized = { ...body }

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***REDACTED***'
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeBody(sanitized[key])
      }
    }

    return sanitized
  }
}

































