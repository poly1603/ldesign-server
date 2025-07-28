import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '用户名或邮箱',
    example: 'admin',
  })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度不能少于3位' })
  @MaxLength(50, { message: '用户名长度不能超过50位' })
  username: string;

  @ApiProperty({
    description: '密码',
    example: '123456',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  @MaxLength(128, { message: '密码长度不能超过128位' })
  password: string;

  @ApiProperty({
    description: '验证码会话ID',
    example: 'captcha_1234567890_abc123',
  })
  @IsNotEmpty({ message: '验证码会话ID不能为空' })
  @IsString({ message: '验证码会话ID必须是字符串' })
  captchaSessionId: string;

  @ApiProperty({
    description: '验证码',
    example: 'ABCD',
  })
  @IsNotEmpty({ message: '验证码不能为空' })
  @IsString({ message: '验证码必须是字符串' })
  captcha: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: '访问令牌' })
  accessToken: string;

  @ApiProperty({ description: '刷新令牌' })
  refreshToken: string;

  @ApiProperty({ description: '令牌类型', example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ description: '过期时间（秒）' })
  expiresIn: number;

  @ApiProperty({ description: '用户信息' })
  user: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    avatar?: string;
    roles: string[];
    permissions: string[];
  };
}