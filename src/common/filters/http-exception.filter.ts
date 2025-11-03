import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Response } from 'express'
import { ApiResponse } from '../dto/response.dto'
import { BusinessException } from '../exceptions/business.exception'

/**
 * 全局异常过滤器
 * 统一处理所有异常，返回标准格式的响应
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let code: string | undefined
    let error: string | undefined

    if (exception instanceof BusinessException) {
      // 处理业务异常
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse() as {
        message: string
        code?: string
        statusCode: number
      }
      message = exceptionResponse.message
      code = exceptionResponse.code
    }
    else if (exception instanceof HttpException) {
      // 处理 HTTP 异常
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      }
      else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as any
        message = responseObj.message || message
        error = responseObj.error
        code = responseObj.code
      }
    }
    else if (exception instanceof Error) {
      // 处理未知错误
      message = exception.message
      error = exception.stack
      // 记录未处理的错误
      this.logger.error(
        `未处理的异常: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      )
    }

    const apiResponse: ApiResponse = {
      success: false,
      message,
      code,
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    }

    response.status(status).json(apiResponse)
  }
}

