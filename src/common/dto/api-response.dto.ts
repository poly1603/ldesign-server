import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * Standard API Response DTO
 * @template T - The type of the data payload
 */
export class ApiResponseDto<T = any> {
  /**
   * Indicates whether the request was successful
   * @example true
   */
  @ApiProperty({ description: 'Indicates whether the request was successful', example: true })
  success: boolean

  /**
   * The response data payload
   */
  @ApiPropertyOptional({ description: 'The response data payload' })
  data?: T

  /**
   * Optional message describing the response
   * @example "Operation completed successfully"
   */
  @ApiPropertyOptional({ description: 'Optional message describing the response', example: 'Operation completed successfully' })
  message?: string

  /**
   * Timestamp of the response (ISO 8601 format)
   * @example "2025-11-04T12:00:00.000Z"
   */
  @ApiProperty({ description: 'Timestamp of the response (ISO 8601 format)', example: new Date().toISOString() })
  timestamp: string

  constructor(success: boolean, data?: T, message?: string) {
    this.success = success
    this.data = data
    this.message = message
    this.timestamp = new Date().toISOString()
  }

  /**
   * Create a successful response
   * @param data - The data to include in the response
   * @param message - Optional success message
   */
  static success<T>(data?: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto(true, data, message)
  }

  /**
   * Create an error response
   * @param message - Error message
   * @param data - Optional error details
   */
  static error<T>(message: string, data?: T): ApiResponseDto<T> {
    return new ApiResponseDto(false, data, message)
  }
}








