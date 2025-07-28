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
import { RoleStatus } from '../../entities/role.entity';

export class QueryRoleDto {
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
    description: '角色状态',
    enum: RoleStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(RoleStatus)
  status?: RoleStatus;

  @ApiProperty({ description: '是否为系统角色', required: false })
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