import { HttpException, HttpStatus } from '@nestjs/common'

/**
 * 业务异常类
 * 用于处理业务逻辑错误
 */
export class BusinessException extends HttpException {
  /**
   * 创建业务异常
   * @param message - 错误消息
   * @param code - 错误代码（可选）
   * @param statusCode - HTTP 状态码（默认 400）
   */
  constructor(
    message: string,
    code?: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        message,
        code,
        statusCode,
      },
      statusCode,
    )
  }
}

/**
 * 未找到资源异常
 */
export class NotFoundBusinessException extends BusinessException {
  constructor(message: string, code?: string) {
    super(message, code, HttpStatus.NOT_FOUND)
  }
}

/**
 * 冲突异常（如资源已存在）
 */
export class ConflictBusinessException extends BusinessException {
  constructor(message: string, code?: string) {
    super(message, code, HttpStatus.CONFLICT)
  }
}

/**
 * 未授权异常
 */
export class UnauthorizedBusinessException extends BusinessException {
  constructor(message: string, code?: string) {
    super(message, code, HttpStatus.UNAUTHORIZED)
  }
}

/**
 * 禁止访问异常
 */
export class ForbiddenBusinessException extends BusinessException {
  constructor(message: string, code?: string) {
    super(message, code, HttpStatus.FORBIDDEN)
  }
}
