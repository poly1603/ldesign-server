import { ApiProperty } from '@nestjs/swagger'
import { ApiResponseDto } from './api-response.dto.js'

/**
 * Pagination metadata
 */
export class PaginationMeta {
  /**
   * Current page number (1-based)
   * @example 1
   */
  @ApiProperty({ description: 'Current page number (1-based)', example: 1 })
  page: number

  /**
   * Number of items per page
   * @example 10
   */
  @ApiProperty({ description: 'Number of items per page', example: 10 })
  pageSize: number

  /**
   * Total number of items across all pages
   * @example 100
   */
  @ApiProperty({ description: 'Total number of items across all pages', example: 100 })
  totalItems: number

  /**
   * Total number of pages
   * @example 10
   */
  @ApiProperty({ description: 'Total number of pages', example: 10 })
  totalPages: number

  /**
   * Whether there is a next page
   * @example true
   */
  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNextPage: boolean

  /**
   * Whether there is a previous page
   * @example false
   */
  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  hasPreviousPage: boolean

  constructor(page: number, pageSize: number, totalItems: number) {
    this.page = page
    this.pageSize = pageSize
    this.totalItems = totalItems
    this.totalPages = Math.ceil(totalItems / pageSize)
    this.hasNextPage = page < this.totalPages
    this.hasPreviousPage = page > 1
  }
}

/**
 * Paginated data wrapper
 * @template T - The type of items in the list
 */
export class PaginatedData<T> {
  /**
   * Array of items for the current page
   */
  @ApiProperty({ description: 'Array of items for the current page', isArray: true })
  items: T[]

  /**
   * Pagination metadata
   */
  @ApiProperty({ description: 'Pagination metadata', type: PaginationMeta })
  meta: PaginationMeta

  constructor(items: T[], page: number, pageSize: number, totalItems: number) {
    this.items = items
    this.meta = new PaginationMeta(page, pageSize, totalItems)
  }
}

/**
 * Paginated API Response DTO
 * @template T - The type of items in the paginated list
 */
export class PaginatedResponseDto<T> extends ApiResponseDto<PaginatedData<T>> {
  constructor(items: T[], page: number, pageSize: number, totalItems: number, message?: string) {
    super(true, new PaginatedData(items, page, pageSize, totalItems), message)
  }

  /**
   * Create a paginated response
   * @param items - Array of items for the current page
   * @param page - Current page number
   * @param pageSize - Number of items per page
   * @param totalItems - Total number of items
   * @param message - Optional message
   */
  static create<T>(
    items: T[],
    page: number,
    pageSize: number,
    totalItems: number,
    message?: string,
  ): PaginatedResponseDto<T> {
    return new PaginatedResponseDto(items, page, pageSize, totalItems, message)
  }
}









