import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateCaptchaDto {
  @ApiProperty({
    description: '验证码会话ID（可选，用于刷新验证码）',
    required: false,
  })
  sessionId?: string;
}

export class GenerateCaptchaResponseDto {
  @ApiProperty({ description: '验证码会话ID' })
  sessionId: string;

  @ApiProperty({ description: '验证码图片（Base64编码）' })
  captchaImage: string;

  @ApiProperty({ description: '验证码过期时间（秒）' })
  expiresIn: number;
}

export class VerifyCaptchaDto {
  @ApiProperty({
    description: '验证码会话ID',
    example: 'captcha_session_123456',
  })
  @IsNotEmpty({ message: '验证码会话ID不能为空' })
  @IsString({ message: '验证码会话ID必须是字符串' })
  sessionId: string;

  @ApiProperty({
    description: '验证码',
    example: 'ABCD',
  })
  @IsNotEmpty({ message: '验证码不能为空' })
  @IsString({ message: '验证码必须是字符串' })
  captcha: string;
}

export class VerifyCaptchaResponseDto {
  @ApiProperty({ description: '验证结果' })
  valid: boolean;

  @ApiProperty({ description: '验证消息' })
  message: string;
}