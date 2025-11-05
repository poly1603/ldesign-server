import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsEnum, IsOptional } from 'class-validator'

export enum ToolType {
  NODE = 'node',
  GIT = 'git',
  NVM_WINDOWS = 'nvm-windows',
  NVS = 'nvs',
  FNM = 'fnm',
}

export enum PlatformType {
  WINDOWS = 'windows',
  MACOS = 'macos',
  LINUX = 'linux',
}

export class InstallToolDto {
  @ApiProperty({ description: 'Tool type to install', enum: ToolType })
  @IsEnum(ToolType)
  tool: ToolType

  @ApiProperty({ description: 'Target platform', enum: PlatformType, required: false })
  @IsOptional()
  @IsEnum(PlatformType)
  platform?: PlatformType

  @ApiProperty({ description: 'Specific version to install', required: false })
  @IsOptional()
  @IsString()
  version?: string
}

export class UninstallToolDto {
  @ApiProperty({ description: 'Tool type to uninstall', enum: ToolType })
  @IsEnum(ToolType)
  tool: ToolType

  @ApiProperty({ description: 'Target platform', enum: PlatformType, required: false })
  @IsOptional()
  @IsEnum(PlatformType)
  platform?: PlatformType
}

export class CheckToolDto {
  @ApiProperty({ description: 'Tool type to check', enum: ToolType })
  @IsEnum(ToolType)
  tool: ToolType
}

export class UpdateToolDto {
  @ApiProperty({ description: 'Tool type to update', enum: ToolType })
  @IsEnum(ToolType)
  tool: ToolType

  @ApiProperty({ description: 'Target version', required: false })
  @IsOptional()
  @IsString()
  version?: string
}
