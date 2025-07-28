import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { PermissionType, PermissionStatus } from '../../entities/permission.entity';

export class CreatePermissionDto {
  @ApiProperty({ description: '权限名称', example: 'user:create' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '显示名称', example: '创建用户', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiProperty({ description: '权限描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '权限类型',
    enum: PermissionType,
    default: PermissionType.BUTTON,
  })
  @IsEnum(PermissionType)
  type: PermissionType;

  @ApiProperty({
    description: '权限状态',
    enum: PermissionStatus,
    default: PermissionStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PermissionStatus)
  status?: PermissionStatus;

  @ApiProperty({ description: '父级权限ID', required: false })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({ description: '排序', example: 0, required: false })
  @IsOptional()
  @IsNumber()
  sort?: number;

  @ApiProperty({ description: '权限路径', example: '/api/users', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  path?: string;

  @ApiProperty({ description: '请求方法', example: 'POST', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  method?: string;

  @ApiProperty({ description: '权限图标', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string;

  @ApiProperty({ description: '是否为系统权限', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}