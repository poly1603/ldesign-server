/** API Operation
 * @module builder/builder.controller
 */

import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger'
import { BuilderService } from './builder.service.js'
import { BuildProjectDto, AnalyzeProjectDto } from './dto/build-project.dto.js'

/** API Operation
 * API Operation
 */
@ApiTags('builder')
@Controller('builder')
export class BuilderController {
  constructor(private readonly builderService: BuilderService) {}

  /**
 * API Operation
 */
  @Post('build')
  @ApiOperation({ summary: 'API Operation' })
  @ApiBody({ type: BuildProjectDto })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 200, description: 'Success' })
  async build(@Body() dto: BuildProjectDto) {
    const result = await this.builderService.build(dto)
    return {
      success: result.success,
      message: result.message,
      data: result,
    }
  }

  /**
 * API Operation
 */
  @Post('analyze')
  @ApiOperation({ summary: 'API Operation' })
  @ApiBody({ type: AnalyzeProjectDto })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 200, description: 'Success' })
  async analyze(@Body() dto: AnalyzeProjectDto) {
    const analysis = await this.builderService.analyze(dto.path)
    return {
      success: true,
      data: analysis,
    }
  }

  /** API Operation
   */
  @Get('engines')
  @ApiOperation({ summary: 'API Operation' })
  async getEngines() {
    const engines = await this.builderService.getSupportedEngines()
    return {
      success: true,
      data: engines,
    }
  }

  /** API Operation
   */
  @Get('formats')
  @ApiOperation({ summary: 'API Operation' })
  async getFormats() {
    const formats = await this.builderService.getSupportedFormats()
    return {
      success: true,
      data: formats,
    }
  }
}
