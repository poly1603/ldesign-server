import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator'

export class LaunchAppDto {
  @ApiProperty({ description: 'Application path or command' })
  @IsString()
  app: string

  @ApiProperty({ description: 'Command arguments', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  args?: string[]

  @ApiProperty({ description: 'Working directory', required: false })
  @IsOptional()
  @IsString()
  cwd?: string

  @ApiProperty({ description: 'Wait for app to exit', default: false, required: false })
  @IsOptional()
  wait?: boolean
}

export class KillProcessDto {
  @ApiProperty({ description: 'Process ID' })
  @IsNumber()
  pid: number
}

export class FindProcessDto {
  @ApiProperty({ description: 'Process name to search' })
  @IsString()
  name: string
}
