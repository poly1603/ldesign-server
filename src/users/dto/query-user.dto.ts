import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { UserStatus } from '../../entities/user.entity';

export class QueryUserDto {
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
    description: '用户状态',
    enum: UserStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ description: '角色ID', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  roleId?: number;

  @ApiProperty({
    description: '排序字段',
    example: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: '排序方向',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}