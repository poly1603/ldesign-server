import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseDto<T = any> {
  @ApiProperty({ description: '状态码', example: 200 })
  code: number;

  @ApiProperty({ description: '响应消息', example: '操作成功' })
  message: string;

  @ApiPropertyOptional({ description: '响应数据' })
  data?: T;

  @ApiPropertyOptional({ description: '时间戳' })
  timestamp?: number;

  @ApiPropertyOptional({ description: '请求路径' })
  path?: string;

  constructor(code: number, message: string, data?: T, path?: string) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.timestamp = Date.now();
    this.path = path;
  }

  static success<T>(data?: T, message = '操作成功', path?: string): ResponseDto<T> {
    return new ResponseDto(200, message, data, path);
  }

  static error(message = '操作失败', code = 500, path?: string): ResponseDto {
    return new ResponseDto(code, message, null, path);
  }

  static created<T>(data?: T, message = '创建成功', path?: string): ResponseDto<T> {
    return new ResponseDto(201, message, data, path);
  }

  static updated<T>(data?: T, message = '更新成功', path?: string): ResponseDto<T> {
    return new ResponseDto(200, message, data, path);
  }

  static deleted(message = '删除成功', path?: string): ResponseDto {
    return new ResponseDto(200, message, null, path);
  }
}

export class ErrorResponseDto {
  @ApiProperty({ description: '错误状态码' })
  statusCode: number;

  @ApiProperty({ description: '错误消息' })
  message: string | string[];

  @ApiPropertyOptional({ description: '错误详情' })
  error?: string;

  @ApiPropertyOptional({ description: '时间戳' })
  timestamp?: string;

  @ApiPropertyOptional({ description: '请求路径' })
  path?: string;
}

export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({ description: '验证错误详情', type: [String] })
  declare message: string[];

  @ApiProperty({ description: '错误类型', example: 'Bad Request' })
  declare error: string;
}