import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsObject,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

// Operation
export enum DeployPlatform {
  DOCKER = 'docker',
  KUBERNETES = 'kubernetes',
  AWS = 'aws',
  AZURE = 'azure',
  GCP = 'gcp',
  VERCEL = 'vercel',
  NETLIFY = 'netlify',
  HEROKU = 'heroku',
  PM2 = 'pm2',
  NGINX = 'nginx',
}

// Operation
export enum DeployStrategy {
  ROLLING = 'rolling',
  BLUE_GREEN = 'blue-green',
  CANARY = 'canary',
  RECREATE = 'recreate',
  A_B = 'a-b',
}

// Operation
export enum DeployEnvironment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

// Operation
class DockerConfigDto {
  @ApiPropertyOptional({ description: 'Dockerfile path' })
  @IsOptional()
  @IsString()
  dockerfile?: string

  @ApiPropertyOptional({ description: 'Docker image name' })
  @IsOptional()
  @IsString()
  image?: string

  @ApiPropertyOptional({ description: 'Docker registry' })
  @IsOptional()
  @IsString()
  registry?: string

  @ApiPropertyOptional({ description: 'Build arguments' })
  @IsOptional()
  @IsObject()
  buildArgs?: Record<string, string>
}

// Operation
class K8sConfigDto {
  @ApiPropertyOptional({ description: 'Namespace' })
  @IsOptional()
  @IsString()
  namespace?: string

  @ApiPropertyOptional({ description: 'Deployment name' })
  @IsOptional()
  @IsString()
  deployment?: string

  @ApiPropertyOptional({ description: 'Replicas count' })
  @IsOptional()
  @IsNumber()
  replicas?: number

  @ApiPropertyOptional({ description: 'Config map' })
  @IsOptional()
  @IsObject()
  configMap?: Record<string, any>
}

// Operation
export class DeployDto {
  @ApiProperty({ description: 'Project path to deploy' })
  @IsString()
  path: string

  @ApiProperty({ 
    enum: DeployPlatform,
    description: 'Deployment platform' 
  })
  @IsEnum(DeployPlatform)
  platform: DeployPlatform

  @ApiProperty({ 
    enum: DeployEnvironment,
    description: 'Deployment environment' 
  })
  @IsEnum(DeployEnvironment)
  environment: DeployEnvironment

  @ApiPropertyOptional({ 
    enum: DeployStrategy,
    description: 'Deployment strategy' 
  })
  @IsOptional()
  @IsEnum(DeployStrategy)
  strategy?: DeployStrategy

  @ApiPropertyOptional({ description: 'Version/tag to deploy' })
  @IsOptional()
  @IsString()
  version?: string

  @ApiPropertyOptional({ description: 'Docker configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DockerConfigDto)
  docker?: DockerConfigDto

  @ApiPropertyOptional({ description: 'Kubernetes configuration' })
  @IsOptional()
  @ValidateNested()
  @Type(() => K8sConfigDto)
  k8s?: K8sConfigDto

  @ApiPropertyOptional({ description: 'Environment variables' })
  @IsOptional()
  @IsObject()
  envVars?: Record<string, string>

  @ApiPropertyOptional({ description: 'Auto rollback on failure' })
  @IsOptional()
  @IsBoolean()
  autoRollback?: boolean
}

// Operation
export class RollbackDto {
  @ApiProperty({ description: 'Deployment ID or name' })
  @IsString()
  deploymentId: string

  @ApiPropertyOptional({ description: 'Version to rollback to' })
  @IsOptional()
  @IsString()
  version?: string

  @ApiPropertyOptional({ description: 'Number of versions to rollback' })
  @IsOptional()
  @IsNumber()
  steps?: number
}

// Operation
export class ScaleDto {
  @ApiProperty({ description: 'Deployment ID or name' })
  @IsString()
  deploymentId: string

  @ApiProperty({ description: 'Number of replicas' })
  @IsNumber()
  replicas: number

  @ApiPropertyOptional({ description: 'Auto-scaling configuration' })
  @IsOptional()
  @IsObject()
  autoScaling?: {
    enabled: boolean
    minReplicas?: number
    maxReplicas?: number
    cpuPercent?: number
    memoryPercent?: number
  }
}

// Operation
export class HealthCheckDto {
  @ApiProperty({ description: 'Service URL or deployment ID' })
  @IsString()
  target: string

  @ApiPropertyOptional({ description: 'Health check path' })
  @IsOptional()
  @IsString()
  path?: string

  @ApiPropertyOptional({ description: 'Check interval in seconds' })
  @IsOptional()
  @IsNumber()
  interval?: number

  @ApiPropertyOptional({ description: 'Timeout in seconds' })
  @IsOptional()
  @IsNumber()
  timeout?: number
}

// Operation
export class ConfigureDeploymentDto {
  @ApiProperty({ description: 'Deployment configuration name' })
  @IsString()
  name: string

  @ApiProperty({ 
    enum: DeployPlatform,
    description: 'Deployment platform' 
  })
  @IsEnum(DeployPlatform)
  platform: DeployPlatform

  @ApiPropertyOptional({ description: 'Configuration details' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>

  @ApiPropertyOptional({ description: 'Save configuration' })
  @IsOptional()
  @IsBoolean()
  save?: boolean
}

// Operation
export class SetupCICDDto {
  @ApiProperty({ description: 'Project path' })
  @IsString()
  path: string

  @ApiProperty({ description: 'CI/CD provider' })
  @IsEnum(['github-actions', 'gitlab-ci', 'jenkins', 'circleci', 'travis'])
  provider: string

  @ApiPropertyOptional({ description: 'Pipeline configuration' })
  @IsOptional()
  @IsObject()
  pipeline?: {
    stages?: string[]
    triggers?: string[]
    notifications?: Record<string, any>
  }

  @ApiPropertyOptional({ description: 'Deployment targets' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targets?: string[]
}

// Operation
export class ManageContainersDto {
  @ApiProperty({ description: 'Container action' })
  @IsEnum(['list', 'start', 'stop', 'restart', 'remove'])
  action: string

  @ApiPropertyOptional({ description: 'Container ID or name' })
  @IsOptional()
  @IsString()
  containerId?: string

  @ApiPropertyOptional({ description: 'Filter options' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>
}