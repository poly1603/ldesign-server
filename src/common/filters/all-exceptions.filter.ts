import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseDto } from '../dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      // HTTP异常
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = Array.isArray(responseObj.message) 
          ? responseObj.message.join(', ') 
          : responseObj.message || exception.message;
        error = responseObj.error || exception.name;
      } else {
        message = exceptionResponse as string;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      // 普通错误
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message || '服务器内部错误';
      error = exception.name || 'InternalServerError';
    } else {
      // 未知错误
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      error = 'UnknownError';
    }

    // 记录错误日志
    this.logger.error(
      `Exception caught: ${status} - ${message} - ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    // 开发环境返回详细错误信息，生产环境返回简化信息
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const errorResponse = ResponseDto.error(
      isDevelopment ? message : '服务器内部错误',
      status,
      request.url,
    );

    // 在开发环境添加额外的调试信息
    if (isDevelopment && exception instanceof Error) {
      (errorResponse as any).stack = exception.stack;
      (errorResponse as any).error = error;
    }

    response.status(status).json(errorResponse);
  }
}