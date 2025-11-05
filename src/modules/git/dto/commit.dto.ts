import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

/**
 * API Operation
 */
export class CommitDto {
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
  @ApiProperty({ description: '', example: 'Fix bug' })
  @IsString()
  @IsNotEmpty()
  message: string

  /**
 * API Operation
 */
  @ApiPropertyOptional({ description: '', type: [String], example: ['file1.ts', 'file2.ts'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[]
}

