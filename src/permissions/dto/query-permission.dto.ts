import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PermissionType, PermissionStatus } from '../../entities/permission.entity';

export class QueryPermissionDto {
  @ApiProperty({ description: '页码', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', example: 10, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: '权限类型',
    enum: PermissionType,
    required: false,
  })
  @IsOptional()
  @IsEnum(PermissionType)
  type?: PermissionType;

  @ApiProperty({
    description: '权限状态',
    enum: PermissionStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(PermissionStatus)
  status?: PermissionStatus;

  @ApiProperty({ description: '父级权限ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parentId?: number;

  @ApiProperty({ description: '是否为系统权限', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isSystem?: boolean;

  @ApiProperty({
    description: '排序字段',
    example: 'sort',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'sort';

  @ApiProperty({
    description: '排序方向',
    example: 'ASC',
    enum: ['ASC', 'DESC'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}