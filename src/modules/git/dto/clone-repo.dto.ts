import { IsString, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * API Operation
 */
export class CloneRepoDto {
  /**
 * API Operation
 */
  @ApiProperty({ description: ' URL', example: 'https://github.com/user/repo.git' })
  @IsString()
  @IsNotEmpty()
  url: string

  /**
 * API Operation
 */
  @ApiProperty({ description: '', example: '/path/to/destination' })
  @IsString()
  @IsNotEmpty()
  path: string
}

