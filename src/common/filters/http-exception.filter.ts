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

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string | string[];
    let error: string;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      message = responseObj.message || exception.message;
      error = responseObj.error || exception.name;
    } else {
      message = exceptionResponse as string;
      error = exception.name;
    }

    // 记录错误日志
    this.logger.error(
      `HTTP Exception: ${status} - ${JSON.stringify(message)} - ${request.method} ${request.url}`,
      exception.stack,
    );

    const errorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // 根据状态码返回不同的响应格式
    if (status === HttpStatus.BAD_REQUEST && Array.isArray(message)) {
      // 验证错误
      response.status(status).json({
        ...errorResponse,
        message: message,
      });
    } else {
      // 其他HTTP错误
      response.status(status).json(ResponseDto.error(
        Array.isArray(message) ? message.join(', ') : message,
        status,
        request.url,
      ));
    }
  }
}