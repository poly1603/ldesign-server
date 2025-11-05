import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * API Operation
 */
export class ApiResponse<T = any> {
  /**
 * API Operation
 */
  @ApiProperty({ description: '', example: true })
  success: boolean

  /**
 * API Operation
 */
  @ApiPropertyOptional({ description: '' })
  data?: T

  /**
 * API Operation
 */
  @ApiPropertyOptional({ description: '', example: '' })
  message?: string

  /**
 * API Operation
 */
  @ApiPropertyOptional({ description: '' })
  code?: string

  /**
 * API Operation
 */
  @ApiPropertyOptional({ description: '' })
  error?: string
}

