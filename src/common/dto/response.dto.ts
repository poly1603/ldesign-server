import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * 统一响应格式
 * 所有 API 接口统一使用此格式返回数据
 */
export class ApiResponse<T = any> {
  /**
   * 请求是否成功
   * @example true
   */
  @ApiProperty({ description: '请求是否成功', example: true })
  success: boolean

  /**
   * 响应数据
   */
  @ApiPropertyOptional({ description: '响应数据' })
  data?: T

  /**
   * 成功消息
   */
  @ApiPropertyOptional({ description: '成功消息', example: '操作成功' })
  message?: string

  /**
   * 错误代码
   */
  @ApiPropertyOptional({ description: '错误代码' })
  code?: string

  /**
   * 错误信息（仅在开发环境返回）
   */
  @ApiPropertyOptional({ description: '错误信息（仅开发环境）' })
  error?: string
}

