import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  MinLength,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';
import { UserStatus } from '../../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: '邮箱', example: 'john@example.com' })
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty({ description: '密码', example: 'password123' })
  @IsString()
  @MinLength(6)
  @MaxLength(255)
  password: string;

  @ApiProperty({ description: '名字', example: 'John', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({ description: '姓氏', example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({ description: '手机号', example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: '头像URL', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: '用户状态',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({
    description: '角色ID列表',
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  roleIds?: number[];
}