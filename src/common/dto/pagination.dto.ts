import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min, Max } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    description: '页码',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: '页码必须是正整数' })
  @Min(1, { message: '页码不能小于1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数量',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive({ message: '每页数量必须是正整数' })
  @Min(1, { message: '每页数量不能小于1' })
  @Max(100, { message: '每页数量不能超过100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: '排序字段',
  })
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    description: '排序方向',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({
    description: '搜索关键词',
  })
  @IsOptional()
  search?: string;
}

export class PaginationResponseDto<T> {
  @ApiPropertyOptional({ description: '数据列表' })
  data: T[];

  @ApiPropertyOptional({ description: '总数量' })
  total: number;

  @ApiPropertyOptional({ description: '当前页码' })
  page: number;

  @ApiPropertyOptional({ description: '每页数量' })
  limit: number;

  @ApiPropertyOptional({ description: '总页数' })
  totalPages: number;

  @ApiPropertyOptional({ description: '是否有下一页' })
  hasNext: boolean;

  @ApiPropertyOptional({ description: '是否有上一页' })
  hasPrev: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}