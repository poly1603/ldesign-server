import { IsString, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * API Operation
 */
export class InitRepoDto {
  /**
 * API Operation
 */
  @ApiProperty({ description: '', example: '/path/to/repo' })
  @IsString()
  @IsNotEmpty()
  path: string
}

