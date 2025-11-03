import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { ApiResponse } from '../dto/response.dto'

/**
 * 响应转换拦截器
 * 统一将响应包装为标准格式
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果已经是标准格式，直接返回
        if (data && typeof data === 'object' && 'success' in data) {
          return data as ApiResponse<T>
        }

        // 否则包装为标准格式
        return {
          success: true,
          data,
        }
      }),
    )
  }
}

