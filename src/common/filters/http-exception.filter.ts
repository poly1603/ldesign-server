import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseDto } from '../dto/response.dto';

/**
 * 全局异常过滤器
 * 统一处理所有异常，返回标准格式
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 判断异常类型
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 获取异常信息
    let message = '服务器内部错误';
    let code = status;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object') {
        message =
          (exceptionResponse as any).message ||
          (exceptionResponse as any).error ||
          message;
        code = (exceptionResponse as any).code || status;

        // 处理验证错误
        if (Array.isArray(message)) {
          message = message.join(', ');
        }
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // 记录错误日志
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception.stack,
    );

    // 返回标准错误响应
    const errorResponse = new ResponseDto(
      code,
      message,
      null,
      request.url,
    );

    response.status(status).json(errorResponse);
  }
}
