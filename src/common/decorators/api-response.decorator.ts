import { SetMetadata } from '@nestjs/common';
import { ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { ResponseDto } from '../dto/response.dto';

/**
 * 自定义响应消息装饰器
 */
export const ResponseMessage = (message: string) =>
  SetMetadata('response_message', message);

/**
 * API 标准响应装饰器
 * 结合 Swagger 文档和自定义消息
 */
export function ApiStandardResponse(
  message: string,
  type?: any,
  status: number = 200,
) {
  return applyDecorators(
    ResponseMessage(message),
    SwaggerApiResponse({
      status,
      description: message,
      type: type ? ResponseDto : undefined,
    }),
  );
}

/**
 * API 成功响应装饰器
 */
export function ApiSuccessResponse(message: string, type?: any) {
  return ApiStandardResponse(message, type, 200);
}

/**
 * API 创建成功响应装饰器
 */
export function ApiCreatedResponse(message: string = '创建成功', type?: any) {
  return ApiStandardResponse(message, type, 201);
}
