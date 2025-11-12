import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常类
 * 用于处理业务逻辑中的错误
 */
export class BusinessException extends HttpException {
  constructor(
    message: string,
    code: number = HttpStatus.BAD_REQUEST,
    statusCode: HttpStatus = HttpStatus.OK,
  ) {
    super(
      {
        code,
        message,
        timestamp: Date.now(),
      },
      statusCode,
    );
  }
}

/**
 * 常用业务错误码
 */
export enum ErrorCode {
  // 通用错误 1000-1999
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,

  // 业务错误 2000-2999
  VALIDATION_ERROR = 2001,
  RESOURCE_NOT_FOUND = 2002,
  RESOURCE_ALREADY_EXISTS = 2003,
  OPERATION_FAILED = 2004,

  // 认证错误 3000-3999
  TOKEN_EXPIRED = 3001,
  TOKEN_INVALID = 3002,
  NO_PERMISSION = 3003,
}
