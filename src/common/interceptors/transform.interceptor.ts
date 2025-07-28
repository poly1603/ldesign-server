import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseDto<T>> {
    const request = context.switchToHttp().getRequest();
    
    // 检查是否跳过响应转换
    const skipTransform = this.reflector.get<boolean>(
      'skipTransform',
      context.getHandler(),
    );

    if (skipTransform) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // 如果数据已经是ResponseDto格式，直接返回
        if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
          return data;
        }

        // 获取HTTP状态码
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        
        // 根据状态码返回相应的消息
        let message = '操作成功';
        if (statusCode === 201) {
          message = '创建成功';
        } else if (statusCode === 204) {
          message = '删除成功';
        }

        return ResponseDto.success(data, message, request.url);
      }),
    );
  }
}

// 跳过响应转换的装饰器
import { SetMetadata } from '@nestjs/common';
export const SkipTransform = () => SetMetadata('skipTransform', true);