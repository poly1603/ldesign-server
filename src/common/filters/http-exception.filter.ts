import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Response, Request } from 'express'
import { ApiResponse } from '../dto/response.dto.js'
import { BusinessException } from '../exceptions/business.exception.js'

/**
 * Global HTTP Exception Filter
 * Catches all exceptions and returns standardized error responses
 * Handles:
 * - Business exceptions (custom business logic errors)
 * - HTTP exceptions (NestJS built-in exceptions)
 * - Unknown errors (unhandled exceptions)
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const { method, url, ip, headers } = request
    
    // Generate or use existing request ID for tracing
    const requestId = (headers['x-request-id'] as string) || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let code: string | undefined
    let error: string | undefined
    let details: any = undefined

    // Handle different exception types
    if (exception instanceof BusinessException) {
      // Business logic exceptions
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse() as {
        message: string
        code?: string
        statusCode: number
        details?: any
      }
      message = exceptionResponse.message
      code = exceptionResponse.code
      details = exceptionResponse.details

      this.logger.warn(
        `[${requestId}] Business exception: ${message} (code: ${code}) - ${method} ${url}`,
      )
    }
    else if (exception instanceof HttpException) {
      // NestJS HTTP exceptions
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
        details = responseObj.details
      }

      // Log based on status code
      if (status >= 500) {
        this.logger.error(
          `[${requestId}] HTTP exception (${status}): ${message} - ${method} ${url}`,
        )
      } else {
        this.logger.warn(
          `[${requestId}] HTTP exception (${status}): ${message} - ${method} ${url}`,
        )
      }
    }
    else if (exception instanceof Error) {
      // Unknown/unhandled errors
      message = exception.message || 'An unexpected error occurred'
      error = exception.stack

      // Log unhandled errors with full details
      this.logger.error(
        `[${requestId}] Unhandled exception: ${message} - ${method} ${url} - ${ip}`,
        exception.stack,
      )

      // In production, don't expose internal error details
      if (process.env.NODE_ENV === 'production') {
        message = 'An unexpected error occurred. Please try again later.'
        error = undefined
      }
    }
    else {
      // Non-Error exceptions (shouldn't happen, but handle gracefully)
      message = String(exception) || 'An unknown error occurred'
      this.logger.error(
        `[${requestId}] Unknown exception type: ${message} - ${method} ${url}`,
      )
    }

    // Build standardized error response
    const apiResponse: ApiResponse = {
      success: false,
      message,
      ...(code && { code }),
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && error && { error }),
    }
    
    // Add timestamp and request ID separately to avoid type error
    const responseWithMeta = {
      ...apiResponse,
      timestamp: new Date().toISOString(),
      requestId,
      path: url,
    }

    // Set request ID in response header for client-side tracking
    response.setHeader('X-Request-ID', requestId)

    // Send response
    response.status(status).json(responseWithMeta)
  }
}

