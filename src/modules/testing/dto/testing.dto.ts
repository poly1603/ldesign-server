import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator'

export class RunTestsDto {
  @ApiProperty({ description: 'Project directory path' })
  @IsString()
  projectPath: string

  @ApiProperty({ description: 'Test pattern or specific file', required: false })
  @IsOptional()
  @IsString()
  testPattern?: string

  @ApiProperty({ description: 'Watch mode', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  watch?: boolean

  @ApiProperty({ description: 'Generate coverage report', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  coverage?: boolean

  @ApiProperty({ description: 'Test framework', enum: ['jest', 'mocha', 'vitest'], required: false })
  @IsOptional()
  @IsString()
  framework?: string
}

export class RunE2ETestsDto {
  @ApiProperty({ description: 'Project directory path' })
  @IsString()
  projectPath: string

  @ApiProperty({ description: 'Specific test file', required: false })
  @IsOptional()
  @IsString()
  testFile?: string

  @ApiProperty({ description: 'Headless mode', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  headless?: boolean
}

export class GetCoverageDto {
  @ApiProperty({ description: 'Project directory path' })
  @IsString()
  projectPath: string

  @ApiProperty({ description: 'Output format', enum: ['json', 'text', 'html'], default: 'json', required: false })
  @IsOptional()
  @IsString()
  format?: string
}

export class LintDto {
  @ApiProperty({ description: 'Project directory path' })
  @IsString()
  projectPath: string

  @ApiProperty({ description: 'Auto fix issues', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  fix?: boolean

  @ApiProperty({ description: 'Specific files or patterns', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[]
}
