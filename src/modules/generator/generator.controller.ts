/** API Operation
 * @module generator/generator.controller
 */

import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger'
import { GeneratorService } from './generator.service.js'
import {
  GenerateCodeDto,
  GenerateComponentDto,
  GeneratePageDto,
  GenerateApiDto,
  GetTemplatesDto,
} from './dto/generator.dto.js'

/**
 * API Operation
 */
@ApiTags('generator')
@Controller('generator')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  /**
 * API Operation
 */
  @Post('generate')
  @ApiOperation({ summary: 'API Operation' })
  @ApiBody({ type: GenerateCodeDto })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 200, description: 'Success' })
  async generate(@Body() dto: GenerateCodeDto) {
    const result = await this.generatorService.generate(dto)
    return {
      success: result.success,
      message: result.message,
      data: result,
    }
  }

  /**
 * API Operation
 */
  @Post('component')
  @ApiOperation({ summary: 'API Operation' })
  @ApiBody({ type: GenerateComponentDto })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 200, description: 'Success' })
  async generateComponent(@Body() dto: GenerateComponentDto) {
    const result = await this.generatorService.generateComponent(dto)
    return {
      success: result.success,
      message: result.message,
      data: result,
    }
  }

  /**
 * API Operation
 */
  @Post('page')
  @ApiOperation({ summary: 'API Operation' })
  @ApiBody({ type: GeneratePageDto })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 200, description: 'Success' })
  async generatePage(@Body() dto: GeneratePageDto) {
    const result = await this.generatorService.generatePage(dto)
    return {
      success: result.success,
      message: result.message,
      data: result,
    }
  }

  /**
 * API Operation
 */
  @Post('api')
  @ApiOperation({ summary: 'API Operation' })
  @ApiBody({ type: GenerateApiDto })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 200, description: 'Success' })
  async generateApi(@Body() dto: GenerateApiDto) {
    const result = await this.generatorService.generateApi(dto)
    return {
      success: result.success,
      message: result.message,
      data: result,
    }
  }

  /**
 * API Operation
 */
  @Get('templates')
  @ApiOperation({ summary: 'API Operation' })
  @ApiQuery({ name: 'type', required: false, description: '' })
  @ApiQuery({ name: 'category', required: false, description: '' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getTemplates(
    @Query('type') type?: string,
    @Query('category') category?: string,
  ) {
    const templates = await this.generatorService.getTemplates(type as any, category as any)
    return {
      success: true,
      data: templates,
    }
  }
}
