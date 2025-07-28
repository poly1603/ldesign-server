import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: '用户名',
    example: 'john_doe',
  })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度不能少于3位' })
  @MaxLength(50, { message: '用户名长度不能超过50位' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '用户名只能包含字母、数字和下划线',
  })
  username: string;

  @ApiProperty({
    description: '邮箱',
    example: 'john@example.com',
  })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  @MaxLength(100, { message: '邮箱长度不能超过100位' })
  email: string;

  @ApiProperty({
    description: '密码',
    example: 'Password123!',
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  @MaxLength(128, { message: '密码长度不能超过128位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, {
    message: '密码必须包含至少一个大写字母、一个小写字母和一个数字',
  })
  password: string;

  @ApiProperty({
    description: '确认密码',
    example: 'Password123!',
  })
  @IsNotEmpty({ message: '确认密码不能为空' })
  @IsString({ message: '确认密码必须是字符串' })
  confirmPassword: string;

  @ApiProperty({
    description: '姓名',
    example: 'John Doe',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '姓名必须是字符串' })
  @MaxLength(100, { message: '姓名长度不能超过100位' })
  fullName?: string;

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;
}

export class RegisterResponseDto {
  @ApiProperty({ description: '用户ID' })
  id: number;

  @ApiProperty({ description: '用户名' })
  username: string;

  @ApiProperty({ description: '邮箱' })
  email: string;

  @ApiProperty({ description: '姓名' })
  fullName: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;
}