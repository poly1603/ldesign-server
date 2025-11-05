import { 
  Controller, 
  Post, 
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { PublisherService } from './publisher.service.js'
import {
  PublishPackageDto,
  CreateReleaseDto,
  ManageVersionDto,
  ValidatePackageDto,
  ConfigurePublishingDto,
  PublishMultiPlatformDto,
  UnpublishDto,
  GetPublishHistoryDto,
  AutomatePublishDto,
} from './dto/publisher.dto.js'

@ApiTags('publisher')
@Controller('publisher')
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  @Post('publish')
  @ApiOperation({ summary: 'Publish package to registry' })
  @ApiResponse({ status: 200, description: 'Package published successfully' })
  async publishPackage(@Body() publishDto: PublishPackageDto) {
    try {
      return await this.publisherService.publishPackage(publishDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to publish package',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('release')
  @ApiOperation({ summary: 'Create a release' })
  @ApiResponse({ status: 200, description: 'Release created' })
  async createRelease(@Body() releaseDto: CreateReleaseDto) {
    try {
      return await this.publisherService.createRelease(releaseDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create release',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('version')
  @ApiOperation({ summary: 'Manage package version' })
  @ApiResponse({ status: 200, description: 'Version managed successfully' })
  async manageVersion(@Body() versionDto: ManageVersionDto) {
    try {
      return await this.publisherService.manageVersion(versionDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to manage version',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate package before publishing' })
  @ApiResponse({ status: 200, description: 'Validation completed' })
  async validatePackage(@Body() validateDto: ValidatePackageDto) {
    try {
      return await this.publisherService.validatePackage(validateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Package validation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('configure')
  @ApiOperation({ summary: 'Configure publishing settings' })
  @ApiResponse({ status: 200, description: 'Publishing configured' })
  async configurePublishing(@Body() configDto: ConfigurePublishingDto) {
    try {
      return await this.publisherService.configurePublishing(configDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to configure publishing',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('multi-platform')
  @ApiOperation({ summary: 'Publish to multiple platforms' })
  @ApiResponse({ status: 200, description: 'Published to multiple platforms' })
  async publishMultiPlatform(@Body() multiDto: PublishMultiPlatformDto) {
    try {
      return await this.publisherService.publishMultiPlatform(multiDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Multi-platform publishing failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('unpublish')
  @ApiOperation({ summary: 'Unpublish package' })
  @ApiResponse({ status: 200, description: 'Package unpublished' })
  async unpublish(@Body() unpublishDto: UnpublishDto) {
    try {
      return await this.publisherService.unpublish(unpublishDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to unpublish package',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('history')
  @ApiOperation({ summary: 'Get publish history' })
  @ApiResponse({ status: 200, description: 'History retrieved' })
  async getPublishHistory(@Body() historyDto: GetPublishHistoryDto) {
    try {
      return await this.publisherService.getPublishHistory(historyDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get publish history',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('automate')
  @ApiOperation({ summary: 'Setup automated publishing' })
  @ApiResponse({ status: 200, description: 'Automation configured' })
  async automatePublish(@Body() automateDto: AutomatePublishDto) {
    try {
      return await this.publisherService.automatePublish(automateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to setup automated publishing',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
