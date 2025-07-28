import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { RoleStatus } from '../../entities/role.entity';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', example: 'admin' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '显示名称', example: '系统管理员', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiProperty({ description: '角色描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '角色状态',
    enum: RoleStatus,
    default: RoleStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(RoleStatus)
  status?: RoleStatus;

  @ApiProperty({ description: '排序', example: 0, required: false })
  @IsOptional()
  @IsNumber()
  sort?: number;

  @ApiProperty({ description: '是否为系统角色', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiProperty({ description: '角色颜色', example: '#1890ff', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @ApiProperty({
    description: '权限ID列表',
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds?: number[];
}