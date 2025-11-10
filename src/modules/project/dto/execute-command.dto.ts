import { IsString, IsOptional, IsNotEmpty, MaxLength, IsIn } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * Execute Command DTO
 * Used to execute npm/pnpm/yarn scripts in a project
 */
export class ExecuteCommandDto {
  /**
   * Command name to execute (e.g., dev, build, test, preview)
   * Must match a script defined in package.json
   * @example "dev"
   */
  @ApiProperty({
    description: 'Command name to execute (must match a package.json script)',
    example: 'dev',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Command name is required' })
  @MaxLength(100, { message: 'Command name must not exceed 100 characters' })
  command: string

  /**
   * Environment name (development, production, test, staging, preview)
   * Only applicable for dev command when using @ldesign/launcher
   * @example "development"
   */
  @ApiPropertyOptional({
    description: 'Environment name (development, production, test, staging, preview). Only applicable for dev command.',
    example: 'development',
    enum: ['development', 'production', 'test', 'staging', 'preview'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['development', 'production', 'test', 'staging', 'preview'], {
    message: 'Environment must be one of: development, production, test, staging, preview',
  })
  environment?: string

  /**
   * Additional command-line arguments to pass to the script
   * @example "--port 3000 --host 0.0.0.0"
   */
  @ApiPropertyOptional({
    description: 'Additional command-line arguments to pass to the script',
    example: '--port 3000 --host 0.0.0.0',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Arguments must not exceed 500 characters' })
  args?: string
}


