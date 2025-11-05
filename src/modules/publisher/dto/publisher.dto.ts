import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  IsNumber,
} from 'class-validator'

// Operation
export enum PublishPlatform {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm',
  GITHUB = 'github',
  GITLAB = 'gitlab',
  DOCKER_HUB = 'docker-hub',
  PYPI = 'pypi',
  MAVEN = 'maven',
  NUGET = 'nuget',
  RUBYGEMS = 'rubygems',
}

// Operation
export enum PublishType {
  PACKAGE = 'package',
  RELEASE = 'release',
  CONTAINER = 'container',
  ARTIFACT = 'artifact',
}

// Operation
export enum VersionType {
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch',
  PRERELEASE = 'prerelease',
  CUSTOM = 'custom',
}

// Operation
export class PublishPackageDto {
  @ApiProperty({ description: 'Package path' })
  @IsString()
  path: string

  @ApiProperty({ 
    enum: PublishPlatform,
    description: 'Publishing platform' 
  })
  @IsEnum(PublishPlatform)
  platform: PublishPlatform

  @ApiPropertyOptional({ description: 'Package version' })
  @IsOptional()
  @IsString()
  version?: string

  @ApiPropertyOptional({ 
    enum: VersionType,
    description: 'Version bump type' 
  })
  @IsOptional()
  @IsEnum(VersionType)
  versionType?: VersionType

  @ApiPropertyOptional({ description: 'Registry URL' })
  @IsOptional()
  @IsString()
  registry?: string

  @ApiPropertyOptional({ description: 'Access level' })
  @IsOptional()
  @IsEnum(['public', 'restricted', 'private'])
  access?: string

  @ApiPropertyOptional({ description: 'Dry run mode' })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean

  @ApiPropertyOptional({ description: 'Tag for the release' })
  @IsOptional()
  @IsString()
  tag?: string
}

// Operation
export class CreateReleaseDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiProperty({ description: 'Release version' })
  @IsString()
  version: string

  @ApiPropertyOptional({ description: 'Release name' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Release notes' })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({ description: 'Pre-release' })
  @IsOptional()
  @IsBoolean()
  prerelease?: boolean

  @ApiPropertyOptional({ description: 'Draft release' })
  @IsOptional()
  @IsBoolean()
  draft?: boolean

  @ApiPropertyOptional({ description: 'Assets to attach' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assets?: string[]

  @ApiPropertyOptional({ description: 'Target commitish' })
  @IsOptional()
  @IsString()
  target?: string
}

// Operation
export class ManageVersionDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiProperty({ description: 'Action to perform' })
  @IsEnum(['bump', 'set', 'get', 'list'])
  action: string

  @ApiPropertyOptional({ 
    enum: VersionType,
    description: 'Version bump type' 
  })
  @IsOptional()
  @IsEnum(VersionType)
  bumpType?: VersionType

  @ApiPropertyOptional({ description: 'Specific version to set' })
  @IsOptional()
  @IsString()
  version?: string

  @ApiPropertyOptional({ description: 'Update files' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[]

  @ApiPropertyOptional({ description: 'Git tag the version' })
  @IsOptional()
  @IsBoolean()
  gitTag?: boolean
}

// Operation
export class ValidatePackageDto {
  @ApiProperty({ description: 'Package path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'Validation checks' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  checks?: string[]

  @ApiPropertyOptional({ description: 'Fix issues automatically' })
  @IsOptional()
  @IsBoolean()
  autoFix?: boolean

  @ApiPropertyOptional({ description: 'Strict mode' })
  @IsOptional()
  @IsBoolean()
  strict?: boolean
}

// Operation
export class ConfigurePublishingDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiProperty({ 
    enum: PublishPlatform,
    description: 'Target platform' 
  })
  @IsEnum(PublishPlatform)
  platform: PublishPlatform

  @ApiPropertyOptional({ description: 'Configuration options' })
  @IsOptional()
  @IsObject()
  config?: any

  @ApiPropertyOptional({ description: 'Credentials' })
  @IsOptional()
  @IsObject()
  credentials?: {
    token?: string
    username?: string
    password?: string
  }

  @ApiPropertyOptional({ description: 'Save configuration' })
  @IsOptional()
  @IsBoolean()
  save?: boolean
}

// Operation
export class PublishMultiPlatformDto {
  @ApiProperty({ description: 'Package path' })
  @IsString()
  path: string

  @ApiProperty({ description: 'Target platforms' })
  @IsArray()
  @IsEnum(PublishPlatform, { each: true })
  platforms: PublishPlatform[]

  @ApiPropertyOptional({ description: 'Version for all platforms' })
  @IsOptional()
  @IsString()
  version?: string

  @ApiPropertyOptional({ description: 'Skip failed platforms' })
  @IsOptional()
  @IsBoolean()
  skipFailures?: boolean

  @ApiPropertyOptional({ description: 'Parallel publishing' })
  @IsOptional()
  @IsBoolean()
  parallel?: boolean
}

// Operation
export class UnpublishDto {
  @ApiProperty({ description: 'Package name' })
  @IsString()
  packageName: string

  @ApiPropertyOptional({ description: 'Version to unpublish' })
  @IsOptional()
  @IsString()
  version?: string

  @ApiProperty({ 
    enum: PublishPlatform,
    description: 'Platform to unpublish from' 
  })
  @IsEnum(PublishPlatform)
  platform: PublishPlatform

  @ApiPropertyOptional({ description: 'Force unpublish' })
  @IsOptional()
  @IsBoolean()
  force?: boolean
}

// Operation
export class GetPublishHistoryDto {
  @ApiProperty({ description: 'Package or project name' })
  @IsString()
  name: string

  @ApiPropertyOptional({ 
    enum: PublishPlatform,
    description: 'Filter by platform' 
  })
  @IsOptional()
  @IsEnum(PublishPlatform)
  platform?: PublishPlatform

  @ApiPropertyOptional({ description: 'Limit results' })
  @IsOptional()
  @IsNumber()
  limit?: number

  @ApiPropertyOptional({ description: 'Include pre-releases' })
  @IsOptional()
  @IsBoolean()
  includePrerelease?: boolean
}

// Operation
export class AutomatePublishDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiPropertyOptional({ description: 'CI/CD platform' })
  @IsOptional()
  @IsEnum(['github-actions', 'gitlab-ci', 'jenkins', 'circleci'])
  ciPlatform?: string

  @ApiPropertyOptional({ description: 'Trigger conditions' })
  @IsOptional()
  @IsObject()
  triggers?: {
    branch?: string
    tag?: string
    schedule?: string
  }

  @ApiPropertyOptional({ description: 'Pre-publish hooks' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preHooks?: string[]

  @ApiPropertyOptional({ description: 'Post-publish hooks' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  postHooks?: string[]
}