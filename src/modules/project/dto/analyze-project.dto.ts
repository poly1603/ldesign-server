import { IsString, IsNotEmpty, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * Analyze Project DTO
 * Used to analyze a project's structure, dependencies, and configuration
 */
export class AnalyzeProjectDto {
  /**
   * Absolute path to the project directory
   * @example "/home/user/projects/my-app"
   */
  @ApiProperty({
    description: 'Absolute path to the project directory',
    example: '/home/user/projects/my-app',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: 'Project path is required' })
  @MaxLength(500, { message: 'Project path must not exceed 500 characters' })
  path: string
}
