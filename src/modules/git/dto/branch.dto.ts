import { IsString, IsNotEmpty, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * API Operation
 */
export class BranchDto {
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
  @ApiProperty({ description: '', example: 'main' })
  @IsString()
  @IsNotEmpty()
  name: string

  /**
 * API Operation
 */
  @ApiPropertyOptional({ description: '', example: false })
  @IsOptional()
  force?: boolean
}

