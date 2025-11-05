import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator'

export class AnalyzeDepsDto {
  @ApiProperty({ description: 'Project directory path' })
  @IsString()
  projectPath: string

  @ApiProperty({ description: 'Include dev dependencies', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  includeDev?: boolean
}

export class CheckOutdatedDto {
  @ApiProperty({ description: 'Project directory path' })
  @IsString()
  projectPath: string

  @ApiProperty({ description: 'Package manager', enum: ['npm', 'yarn', 'pnpm'], required: false })
  @IsOptional()
  @IsString()
  packageManager?: string
}

export class UpdateDepsDto {
  @ApiProperty({ description: 'Project directory path' })
  @IsString()
  projectPath: string

  @ApiProperty({ description: 'Specific packages to update', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  packages?: string[]

  @ApiProperty({ description: 'Update to latest version', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  latest?: boolean
}

export class InstallDepsDto {
  @ApiProperty({ description: 'Project directory path' })
  @IsString()
  projectPath: string

  @ApiProperty({ description: 'Package manager', enum: ['npm', 'yarn', 'pnpm'], required: false })
  @IsOptional()
  @IsString()
  packageManager?: string

  @ApiProperty({ description: 'Production only', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  production?: boolean
}

export class AuditDepsDto {
  @ApiProperty({ description: 'Project directory path' })
  @IsString()
  projectPath: string

  @ApiProperty({ description: 'Auto fix vulnerabilities', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  fix?: boolean
}

export class SearchPackageDto {
  @ApiProperty({ description: 'Package name or keyword' })
  @IsString()
  query: string

  @ApiProperty({ description: 'Maximum results', default: 20, required: false })
  @IsOptional()
  limit?: number
}

export class PackageInfoDto {
  @ApiProperty({ description: 'Package name' })
  @IsString()
  packageName: string

  @ApiProperty({ description: 'Specific version', required: false })
  @IsOptional()
  @IsString()
  version?: string
}
