/** API Operation
 * @module changelog/changelog.controller
 */

import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger'
import { ChangelogService } from './changelog.service.js'
import { GenerateChangelogDto, ParseCommitsDto, GetVersionChangelogDto } from './dto/changelog.dto.js'

/** API Operation
 * API Operation
 */
@ApiTags('changelog')
@Controller('changelog')
export class ChangelogController {
  constructor(private readonly changelogService: ChangelogService) {}

  /**
 * API Operation
 */
  @Post('generate')
  @ApiOperation({ summary: 'API Operation' })
  @ApiBody({ type: GenerateChangelogDto })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 200, description: 'Success' })
  async generate(@Body() dto: GenerateChangelogDto) {
    const result = await this.changelogService.generate(dto)
    return {
      success: result.success,
      message: result.message,
      data: result,
    }
  }

  /**
 * API Operation
 */
  @Post('parse')
  @ApiOperation({ summary: 'API Operation' })
  @ApiBody({ type: ParseCommitsDto })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 200, description: 'Success' })
  async parseCommits(@Body() dto: ParseCommitsDto) {
    const commits = await this.changelogService.parseCommits(dto)
    return {
      success: true,
      data: commits,
    }
  }

  /** API Operation
   */
  @Post('version')
  @ApiOperation({ summary: 'API Operation' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getVersionChangelog(@Body() dto: GetVersionChangelogDto) {
    const versionInfo = await this.changelogService.getVersionChangelog(dto.path, dto.version)
    return {
      success: true,
      data: versionInfo,
    }
  }

  /**
 * API Operation
 */
  @Get('statistics')
  @ApiOperation({ summary: 'API Operation' })
  @ApiQuery({ name: 'path', description: '', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Success' })
  async getStatistics(@Query('path') path: string) {
    const statistics = await this.changelogService.getStatistics(path)
    return {
      success: true,
      data: statistics,
    }
  }

  /** API Operation
   */
  @Get('formats')
  @ApiOperation({ summary: 'API Operation' })
  async getFormats() {
    const formats = await this.changelogService.getSupportedFormats()
    return {
      success: true,
      data: formats,
    }
  }
}
