import { IsOptional, IsString, MaxLength } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

/**
 * Select Directory DTO
 * Used for file system directory selection dialogs
 */
export class SelectDirectoryDto {
  /**
   * Default directory path to open in the selection dialog
   * @example "/home/user/projects"
   */
  @ApiPropertyOptional({
    description: 'Default directory path to open in the selection dialog',
    example: '/home/user/projects',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Default path must not exceed 500 characters' })
  defaultPath?: string

  /**
   * Title text for the directory selection dialog
   * @example "Select Project Directory"
   */
  @ApiPropertyOptional({
    description: 'Title text for the directory selection dialog',
    example: 'Select Project Directory',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Title must not exceed 100 characters' })
  title?: string
}
