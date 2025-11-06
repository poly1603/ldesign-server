import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
  Logger,
} from '@nestjs/common'
import { Observable, throwError, TimeoutError } from 'rxjs'
import { catchError, timeout } from 'rxjs/operators'

/**
 * Timeout Interceptor
 * Adds a timeout to all HTTP requests to prevent hanging requests
 * Default timeout: 30 seconds
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger('TimeoutInterceptor')
  private readonly defaultTimeout = 30000 // 30 seconds

  constructor(private readonly requestTimeout: number = this.defaultTimeout) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url } = request

    return next.handle().pipe(
      timeout(this.requestTimeout),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          this.logger.warn(`Request timeout: ${method} ${url} (${this.requestTimeout}ms)`)
          return throwError(() => new RequestTimeoutException(
            `Request timeout after ${this.requestTimeout}ms`,
          ))
        }
        return throwError(() => err)
      }),
    )
  }
}









