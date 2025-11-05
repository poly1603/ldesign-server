import { Controller, Post, Get, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { IntegrationService } from './integration.service.js'
import {
  GitHubRepoDto,
  GitHubIssueDto,
  GitHubPRDto,
  GitHubWorkflowDto,
  GitLabProjectDto,
  GitLabPipelineDto,
  GitLabMergeRequestDto,
  DockerBuildDto,
  DockerRunDto,
  DockerOperationDto,
  DockerImageDto,
  JenkinsJobDto,
  JenkinsQueryDto,
  IntegrationConfigDto,
  ListIntegrationConfigDto,
  IntegrationType,
} from './dto/integration.dto.js'

@ApiTags('integration')
@Controller('integration')
export class IntegrationController {
  constructor(private readonly integrationService: IntegrationService) {}

  // ==================== GitHub ====================

  @Post('github/repo')
  @ApiOperation({ summary: 'API Operation' })
  async getGitHubRepo(@Body() dto: GitHubRepoDto) {
    try {
      return await this.integrationService.getGitHubRepo(dto)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('github/issues')
  @ApiOperation({ summary: 'API Operation' })
  async listGitHubIssues(@Body() dto: GitHubRepoDto) {
    try {
      return await this.integrationService.listGitHubIssues(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Issues', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('github/issue/create')
  @ApiOperation({ summary: 'API Operation' })
  async createGitHubIssue(@Body() dto: GitHubIssueDto) {
    try {
      return await this.integrationService.createGitHubIssue(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Issue', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('github/pr/create')
  @ApiOperation({ summary: 'API Operation' })
  async createGitHubPR(@Body() dto: GitHubPRDto) {
    try {
      return await this.integrationService.createGitHubPR(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'PR', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('github/workflows')
  @ApiOperation({ summary: 'API Operation' })
  async listGitHubWorkflows(@Body() dto: GitHubRepoDto) {
    try {
      return await this.integrationService.listGitHubWorkflows(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Workflows', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('github/workflow/trigger')
  @ApiOperation({ summary: 'API Operation' })
  async triggerGitHubWorkflow(@Body() dto: GitHubWorkflowDto) {
    try {
      return await this.integrationService.triggerGitHubWorkflow(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Workflow', HttpStatus.BAD_REQUEST)
    }
  }

  // ==================== GitLab ====================

  @Post('gitlab/project')
  @ApiOperation({ summary: 'API Operation' })
  async getGitLabProject(@Body() dto: GitLabProjectDto) {
    try {
      return await this.integrationService.getGitLabProject(dto)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('gitlab/pipelines')
  @ApiOperation({ summary: 'API Operation' })
  async listGitLabPipelines(@Body() dto: GitLabProjectDto) {
    try {
      return await this.integrationService.listGitLabPipelines(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Pipelines', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('gitlab/pipeline/trigger')
  @ApiOperation({ summary: 'API Operation' })
  async triggerGitLabPipeline(@Body() dto: GitLabPipelineDto) {
    try {
      return await this.integrationService.triggerGitLabPipeline(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Pipeline', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('gitlab/mr/create')
  @ApiOperation({ summary: 'API Operation' })
  async createGitLabMR(@Body() dto: GitLabMergeRequestDto) {
    try {
      return await this.integrationService.createGitLabMR(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'MR', HttpStatus.BAD_REQUEST)
    }
  }

  // ==================== Docker ====================

  @Post('docker/build')
  @ApiOperation({ summary: 'API Operation' })
  async dockerBuild(@Body() dto: DockerBuildDto) {
    try {
      return await this.integrationService.dockerBuild(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Docker', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('docker/run')
  @ApiOperation({ summary: 'API Operation' })
  async dockerRun(@Body() dto: DockerRunDto) {
    try {
      return await this.integrationService.dockerRun(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Docker', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('docker/operation')
  @ApiOperation({ summary: 'API Operation' })
  async dockerOperation(@Body() dto: DockerOperationDto) {
    try {
      return await this.integrationService.dockerOperation(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Docker', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('docker/ps')
  @ApiOperation({ summary: 'API Operation' })
  async dockerPs() {
    try {
      return await this.integrationService.dockerPs()
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('docker/images')
  @ApiOperation({ summary: 'API Operation' })
  async dockerImages() {
    try {
      return await this.integrationService.dockerImages()
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('docker/push')
  @ApiOperation({ summary: 'API Operation' })
  async dockerPush(@Body() dto: DockerImageDto) {
    try {
      return await this.integrationService.dockerPush(dto)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('docker/pull')
  @ApiOperation({ summary: 'API Operation' })
  async dockerPull(@Body() dto: DockerImageDto) {
    try {
      return await this.integrationService.dockerPull(dto)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  // ==================== Jenkins ====================

  @Post('jenkins/job/trigger')
  @ApiOperation({ summary: 'API Operation' })
  async triggerJenkinsJob(@Body() dto: JenkinsJobDto) {
    try {
      return await this.integrationService.triggerJenkinsJob(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Job', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('jenkins/job/status')
  @ApiOperation({ summary: 'API Operation' })
  async getJenkinsJobStatus(@Body() dto: JenkinsQueryDto) {
    try {
      return await this.integrationService.getJenkinsJobStatus(dto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Job', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('jenkins/jobs')
  @ApiOperation({ summary: 'API Operation' })
  async listJenkinsJobs(
    @Query('jenkinsUrl') jenkinsUrl: string,
    @Query('username') username?: string,
    @Query('token') token?: string,
  ) {
    try {
      return await this.integrationService.listJenkinsJobs(jenkinsUrl, username, token)
    } catch (error: any) {
      throw new HttpException(error.message || 'Jobs', HttpStatus.BAD_REQUEST)
    }
  }

  // Operation

  @Post('config')
  @ApiOperation({ summary: 'API Operation' })
  async saveConfig(@Body() dto: IntegrationConfigDto) {
    try {
      return await this.integrationService.saveConfig(dto)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('config/list')
  @ApiOperation({ summary: 'API Operation' })
  async listConfigs(@Body() dto: ListIntegrationConfigDto) {
    try {
      return await this.integrationService.listConfigs(dto)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('config/:type/:name')
  @ApiOperation({ summary: 'API Operation' })
  async getConfig(
    @Param('type') type: IntegrationType,
    @Param('name') name: string,
  ) {
    try {
      return await this.integrationService.getConfig(type, name)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Delete('config/:type/:name')
  @ApiOperation({ summary: 'API Operation' })
  async deleteConfig(
    @Param('type') type: IntegrationType,
    @Param('name') name: string,
  ) {
    try {
      return await this.integrationService.deleteConfig(type, name)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }
}
