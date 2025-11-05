import { IsString, IsNotEmpty, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * Import Directory DTO
 * Used to scan and import all projects from a directory
 */
export class ImportDirectoryDto {
  /**
   * Absolute path to the directory to scan for projects
   * All subdirectories will be scanned for valid projects
   * @example "/home/user/projects"
   */
  @ApiProperty({
    description: 'Absolute path to the directory to scan for projects',
    example: '/home/user/projects',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'Directory path is required' })
  @MaxLength(500, { message: 'Directory path must not exceed 500 characters' })
  directory: string
}
