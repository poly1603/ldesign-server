import { ApiProperty } from '@nestjs/swagger';

/**
 * 统一响应格式
 */
export class ResponseDto<T = any> {
  @ApiProperty({ description: '状态码', example: 200 })
  code: number;

  @ApiProperty({ description: '响应消息', example: '请求成功' })
  message: string;

  @ApiProperty({ description: '响应数据' })
  data?: T;

  @ApiProperty({ description: '时间戳', example: 1699999999999 })
  timestamp: number;

  @ApiProperty({ description: '请求路径', example: '/api/users' })
  path: string;

  constructor(code: number, message: string, data?: T, path?: string) {
    this.code = code;
    this.message = message;
    this.data = data;
    this.timestamp = Date.now();
    this.path = path || '';
  }

  static success<T>(data?: T, message = '请求成功'): ResponseDto<T> {
    return new ResponseDto(200, message, data);
  }

  static error(code: number, message: string): ResponseDto {
    return new ResponseDto(code, message);
  }
}
