import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';
import { Reflector } from '@nestjs/core';

/**
 * 响应转换拦截器
 * 将所有成功响应统一包装成标准格式
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    
    // 获取自定义消息
    const message =
      this.reflector.get<string>('response_message', context.getHandler()) ||
      '请求成功';

    return next.handle().pipe(
      map((data) => {
        // 如果返回的已经是 ResponseDto 格式，直接返回
        if (data instanceof ResponseDto) {
          return data;
        }

        // 否则包装成标准格式
        return new ResponseDto(200, message, data, request.url);
      }),
    );
  }
}
