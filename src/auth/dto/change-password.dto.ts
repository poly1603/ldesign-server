import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: '当前密码',
    example: 'oldPassword123',
  })
  @IsNotEmpty({ message: '当前密码不能为空' })
  @IsString({ message: '当前密码必须是字符串' })
  currentPassword: string;

  @ApiProperty({
    description: '新密码',
    example: 'newPassword123!',
  })
  @IsNotEmpty({ message: '新密码不能为空' })
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(6, { message: '新密码长度不能少于6位' })
  @MaxLength(128, { message: '新密码长度不能超过128位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, {
    message: '新密码必须包含至少一个大写字母、一个小写字母和一个数字',
  })
  newPassword: string;

  @ApiProperty({
    description: '确认新密码',
    example: 'newPassword123!',
  })
  @IsNotEmpty({ message: '确认新密码不能为空' })
  @IsString({ message: '确认新密码必须是字符串' })
  confirmNewPassword: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: '重置令牌',
    example: 'reset-token-string',
  })
  @IsNotEmpty({ message: '重置令牌不能为空' })
  @IsString({ message: '重置令牌必须是字符串' })
  token: string;

  @ApiProperty({
    description: '新密码',
    example: 'newPassword123!',
  })
  @IsNotEmpty({ message: '新密码不能为空' })
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(6, { message: '新密码长度不能少于6位' })
  @MaxLength(128, { message: '新密码长度不能超过128位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/, {
    message: '新密码必须包含至少一个大写字母、一个小写字母和一个数字',
  })
  newPassword: string;

  @ApiProperty({
    description: '确认新密码',
    example: 'newPassword123!',
  })
  @IsNotEmpty({ message: '确认新密码不能为空' })
  @IsString({ message: '确认新密码必须是字符串' })
  confirmNewPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: '邮箱',
    example: 'user@example.com',
  })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsString({ message: '邮箱必须是字符串' })
  email: string;
}