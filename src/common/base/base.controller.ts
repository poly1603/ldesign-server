import { Logger } from '@nestjs/common'

/**
 * Base Controller Class
 * Provides common functionality for all controllers:
 * - Logger instance
 * - Common helper methods
 */
export abstract class BaseController {
  protected abstract readonly logger: Logger

  /**
   * Log method entry
   * @param methodName - Name of the method being called
   * @param params - Method parameters (optional)
   */
  protected logMethodEntry(methodName: string, params?: Record<string, any>): void {
    if (params) {
      // Remove sensitive data from logs
      const sanitizedParams = this.sanitizeParams(params)
      this.logger.log(`${methodName} called with params: ${JSON.stringify(sanitizedParams)}`)
    } else {
      this.logger.log(`${methodName} called`)
    }
  }

  /**
   * Log method success
   * @param methodName - Name of the method
   * @param result - Method result (optional)
   */
  protected logMethodSuccess(methodName: string, result?: any): void {
    if (result) {
      this.logger.log(`${methodName} completed successfully`)
    } else {
      this.logger.log(`${methodName} completed successfully`)
    }
  }

  /**
   * Log method error
   * @param methodName - Name of the method
   * @param error - Error object
   */
  protected logMethodError(methodName: string, error: Error | unknown): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    this.logger.error(`${methodName} failed: ${errorMessage}`)
    if (errorStack && Logger.isLevelEnabled('verbose')) {
      this.logger.verbose(errorStack)
    }
  }

  /**
   * Sanitize parameters for logging
   * Removes sensitive data like passwords, tokens, etc.
   * @param params - Parameters to sanitize
   * @returns Sanitized parameters
   */
  private sanitizeParams(params: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization']
    const sanitized = { ...params }

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '***REDACTED***'
      }
    }

    return sanitized
  }

  /**
   * Create success response
   * @param data - Response data
   * @param message - Optional success message
   * @returns Success response object
   */
  protected successResponse<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      ...(message && { message }),
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Create error response
   * @param message - Error message
   * @param data - Optional error data
   * @returns Error response object
   */
  protected errorResponse<T>(message: string, data?: T) {
    return {
      success: false,
      message,
      ...(data && { data }),
      timestamp: new Date().toISOString(),
    }
  }
}








