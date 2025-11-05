import { IsString, IsNotEmpty, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * API Operation
 */
export class PullPushDto {
  /**
 * API Operation
 */
  @ApiProperty({ description: '', example: '/path/to/repo' })
  @IsString()
  @IsNotEmpty()
  path: string

  /**
 * API Operation
 */
  @ApiPropertyOptional({ description: '', example: 'origin' })
  @IsOptional()
  @IsString()
  remote?: string

  /**
 * API Operation
 */
  @ApiPropertyOptional({ description: '', example: 'main' })
  @IsOptional()
  @IsString()
  branch?: string
}

