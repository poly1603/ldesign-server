import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { DeployerService } from './deployer.service.js'
import {
  DeployDto,
  RollbackDto,
  ScaleDto,
  HealthCheckDto,
  ConfigureDeploymentDto,
  SetupCICDDto,
  ManageContainersDto,
} from './dto/deployer.dto.js'

@ApiTags('deployer')
@Controller('deployer')
export class DeployerController {
  constructor(private readonly deployerService: DeployerService) {}

  @Post('deploy')
  @ApiOperation({ summary: 'Deploy application to specified platform' })
  @ApiResponse({ status: 200, description: 'Deployment initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid deployment configuration' })
  async deploy(@Body() deployDto: DeployDto) {
    try {
      return await this.deployerService.deploy(deployDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Deployment failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('rollback')
  @ApiOperation({ summary: 'Rollback deployment to previous version' })
  @ApiResponse({ status: 200, description: 'Deployment rolled back successfully' })
  async rollback(@Body() rollbackDto: RollbackDto) {
    try {
      return await this.deployerService.rollback(rollbackDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Rollback failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('scale')
  @ApiOperation({ summary: 'Scale deployment replicas' })
  @ApiResponse({ status: 200, description: 'Deployment scaled successfully' })
  async scale(@Body() scaleDto: ScaleDto) {
    try {
      return await this.deployerService.scale(scaleDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Scaling failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('status/:deploymentId')
  @ApiOperation({ summary: 'Get deployment status' })
  @ApiResponse({ status: 200, description: 'Deployment status retrieved' })
  async getStatus(@Param('deploymentId') deploymentId: string) {
    try {
      return await this.deployerService.getStatus(deploymentId)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get deployment status',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('health-check')
  @ApiOperation({ summary: 'Perform health check on deployment' })
  @ApiResponse({ status: 200, description: 'Health check completed' })
  async healthCheck(@Body() healthCheckDto: HealthCheckDto) {
    try {
      return await this.deployerService.healthCheck(healthCheckDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Health check failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('logs/:deploymentId')
  @ApiOperation({ summary: 'Get deployment logs' })
  @ApiQuery({ name: 'lines', required: false, description: 'Number of log lines to retrieve' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  async getLogs(
    @Param('deploymentId') deploymentId: string,
    @Query('lines') lines?: string,
  ) {
    try {
      return await this.deployerService.getLogs(
        deploymentId, 
        lines ? parseInt(lines, 10) : undefined
      )
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get logs',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('configure')
  @ApiOperation({ summary: 'Configure deployment settings' })
  @ApiResponse({ status: 200, description: 'Deployment configured successfully' })
  async configure(@Body() configDto: ConfigureDeploymentDto) {
    try {
      return await this.deployerService.configure(configDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Configuration failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('cicd/setup')
  @ApiOperation({ summary: 'Setup CI/CD pipeline' })
  @ApiResponse({ status: 200, description: 'CI/CD pipeline configured' })
  async setupCICD(@Body() setupDto: SetupCICDDto) {
    try {
      return await this.deployerService.setupCICD(setupDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'CI/CD setup failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('containers')
  @ApiOperation({ summary: 'Manage containers' })
  @ApiResponse({ status: 200, description: 'Container action completed' })
  async manageContainers(@Body() manageDto: ManageContainersDto) {
    try {
      return await this.deployerService.manageContainers(manageDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Container management failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Get('history')
  @ApiOperation({ summary: 'Get deployment history' })
  @ApiQuery({ name: 'environment', required: false, description: 'Filter by environment' })
  @ApiResponse({ status: 200, description: 'Deployment history retrieved' })
  async getHistory(@Query('environment') environment?: string) {
    try {
      return await this.deployerService.getHistory(environment)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get deployment history',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
