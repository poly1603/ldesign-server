import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, IsArray, IsNumber } from 'class-validator'

export enum IntegrationType {
  GITHUB = 'github',
  GITLAB = 'gitlab',
  DOCKER = 'docker',
  JENKINS = 'jenkins',
  GITHUB_ACTIONS = 'github-actions',
  GITLAB_CI = 'gitlab-ci',
}

export enum DockerCommandType {
  BUILD = 'build',
  RUN = 'run',
  STOP = 'stop',
  REMOVE = 'remove',
  PUSH = 'push',
  PULL = 'pull',
  LOGS = 'logs',
  PS = 'ps',
}

// Operation
export class GitHubRepoDto {
  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  owner: string

  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  repo: string

  @ApiProperty({ description: 'GitHub Token', required: false })
  @IsString()
  @IsOptional()
  token?: string
}

export class GitHubIssueDto extends GitHubRepoDto {
  @ApiProperty({ description: 'Issue' })
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty({ description: 'Issue' })
  @IsString()
  @IsNotEmpty()
  body: string

  @ApiProperty({ description: '', required: false })
  @IsArray()
  @IsOptional()
  labels?: string[]

  @ApiProperty({ description: '', required: false })
  @IsArray()
  @IsOptional()
  assignees?: string[]
}

export class GitHubPRDto extends GitHubRepoDto {
  @ApiProperty({ description: 'PR' })
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty({ description: 'PR' })
  @IsString()
  @IsNotEmpty()
  body: string

  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  head: string

  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  base: string
}

export class GitHubWorkflowDto extends GitHubRepoDto {
  @ApiProperty({ description: 'Workflow' })
  @IsString()
  @IsNotEmpty()
  workflowFile: string

  @ApiProperty({ description: '', required: false })
  @IsString()
  @IsOptional()
  ref?: string

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  inputs?: Record<string, any>
}

// Operation
export class GitLabProjectDto {
  @ApiProperty({ description: 'ID' })
  @IsString()
  @IsNotEmpty()
  projectId: string

  @ApiProperty({ description: 'GitLab Token', required: false })
  @IsString()
  @IsOptional()
  token?: string

  @ApiProperty({ description: 'GitLab URL', required: false })
  @IsString()
  @IsOptional()
  gitlabUrl?: string
}

export class GitLabPipelineDto extends GitLabProjectDto {
  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  ref: string

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  variables?: Record<string, string>
}

export class GitLabMergeRequestDto extends GitLabProjectDto {
  @ApiProperty({ description: 'MR' })
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty({ description: 'MR' })
  @IsString()
  @IsNotEmpty()
  description: string

  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  sourceBranch: string

  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  targetBranch: string
}

// Operation
export class DockerBuildDto {
  @ApiProperty({ description: 'Dockerfile' })
  @IsString()
  @IsNotEmpty()
  dockerfile: string

  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  context: string

  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  tag: string

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  buildArgs?: Record<string, string>
}

export class DockerRunDto {
  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  image: string

  @ApiProperty({ description: '', required: false })
  @IsString()
  @IsOptional()
  name?: string

  @ApiProperty({ description: '', required: false })
  @IsArray()
  @IsOptional()
  ports?: string[]

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  env?: Record<string, string>

  @ApiProperty({ description: '', required: false })
  @IsArray()
  @IsOptional()
  volumes?: string[]

  @ApiProperty({ description: '', required: false })
  @IsOptional()
  detach?: boolean
}

export class DockerOperationDto {
  @ApiProperty({ description: 'ID' })
  @IsString()
  @IsNotEmpty()
  container: string

  @ApiProperty({ description: '', enum: DockerCommandType })
  @IsEnum(DockerCommandType)
  @IsNotEmpty()
  operation: DockerCommandType
}

export class DockerImageDto {
  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  image: string

  @ApiProperty({ description: '', required: false })
  @IsString()
  @IsOptional()
  tag?: string
}

// Operation
export class JenkinsJobDto {
  @ApiProperty({ description: 'Jenkins URL' })
  @IsString()
  @IsNotEmpty()
  jenkinsUrl: string

  @ApiProperty({ description: 'Job' })
  @IsString()
  @IsNotEmpty()
  jobName: string

  @ApiProperty({ description: 'Jenkins', required: false })
  @IsString()
  @IsOptional()
  username?: string

  @ApiProperty({ description: 'Jenkins Token', required: false })
  @IsString()
  @IsOptional()
  token?: string

  @ApiProperty({ description: '', required: false })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>
}

export class JenkinsQueryDto {
  @ApiProperty({ description: 'Jenkins URL' })
  @IsString()
  @IsNotEmpty()
  jenkinsUrl: string

  @ApiProperty({ description: 'Job' })
  @IsString()
  @IsNotEmpty()
  jobName: string

  @ApiProperty({ description: '', required: false })
  @IsNumber()
  @IsOptional()
  buildNumber?: number

  @ApiProperty({ description: 'Jenkins', required: false })
  @IsString()
  @IsOptional()
  username?: string

  @ApiProperty({ description: 'Jenkins Token', required: false })
  @IsString()
  @IsOptional()
  token?: string
}

// Operation
export class IntegrationConfigDto {
  @ApiProperty({ description: '', enum: IntegrationType })
  @IsEnum(IntegrationType)
  @IsNotEmpty()
  type: IntegrationType

  @ApiProperty({ description: '' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ description: '' })
  @IsObject()
  @IsNotEmpty()
  config: Record<string, any>
}

export class ListIntegrationConfigDto {
  @ApiProperty({ description: '', enum: IntegrationType, required: false })
  @IsEnum(IntegrationType)
  @IsOptional()
  type?: IntegrationType
}
