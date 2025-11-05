import { IsOptional, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiPropertyOptional } from '@nestjs/swagger'

/**
 * Pagination DTO
 * Used for paginated queries
 */
export class PaginationDto {
  /**
   * Page number (1-based)
   * @example 1
   */
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1

  /**
   * Number of items per page
   * @example 10
   */
  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page size must be an integer' })
  @Min(1, { message: 'Page size must be at least 1' })
  @Max(100, { message: 'Page size must not exceed 100' })
  pageSize?: number = 10

  /**
   * Sort field
   * @example "createdAt"
   */
  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @IsOptional()
  sortBy?: string

  /**
   * Sort order (asc or desc)
   * @example "desc"
   */
  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc'
}

/**
 * Get pagination parameters from DTO
 * @param dto - Pagination DTO
 * @returns Object with skip, take, and order
 */
export function getPaginationParams(dto: PaginationDto) {
  const page = dto.page || 1
  const pageSize = dto.pageSize || 10
  const skip = (page - 1) * pageSize
  const take = pageSize

  const order: Record<string, 'ASC' | 'DESC'> = {}
  if (dto.sortBy) {
    order[dto.sortBy] = (dto.sortOrder || 'desc').toUpperCase() as 'ASC' | 'DESC'
  }

  return { skip, take, order }
}








