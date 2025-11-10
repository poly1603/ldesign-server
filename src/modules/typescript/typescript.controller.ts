import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { TypeScriptService } from './typescript.service.js'
import {
  GetTypeScriptConfigDto,
  UpdateTypeScriptConfigDto,
  UpdateTypeScriptVersionDto,
} from './dto/typescript-config.dto.js'

/**
 * TypeScript 配置控制器
 */
@ApiTags('typescript')
@Controller('api/typescript')
export class TypeScriptController {
  constructor(private readonly typescriptService: TypeScriptService) {}

  /**
   * 获取支持的 TypeScript 版本列表
   */
  @Get('versions')
  @ApiOperation({ summary: 'Get available TypeScript versions' })
  @ApiResponse({ status: 200, description: 'Versions retrieved' })
  async getVersions() {
    const versions = await this.typescriptService.getAvailableVersions()
    return {
      success: true,
      data: versions,
    }
  }

  /**
   * 获取 TypeScript 配置 Schema
   * @param version - TypeScript 版本（可选）
   */
  @Get('schema')
  @ApiOperation({ summary: 'Get TypeScript config schema' })
  @ApiResponse({ status: 200, description: 'Schema retrieved' })
  async getSchema(@Query('version') version?: string) {
    const schema = await this.typescriptService.getConfigSchema(version)
    return {
      success: true,
      data: schema,
    }
  }

  /**
   * 获取项目的当前 TypeScript 版本
   */
  @Get('project/:projectId/version')
  @ApiOperation({ summary: 'Get current TypeScript version' })
  @ApiResponse({ status: 200, description: 'Version retrieved' })
  async getCurrentVersion(@Param('projectId') projectId: string) {
    return await this.typescriptService.getCurrentTypeScriptVersion(projectId)
  }

  /**
   * 获取项目的 TypeScript 配置
   */
  @Get('project/:projectId/config')
  @ApiOperation({ summary: 'Get TypeScript config' })
  @ApiResponse({ status: 200, description: 'Config retrieved' })
  async getConfig(@Param('projectId') projectId: string) {
    return await this.typescriptService.getTypeScriptConfig(projectId)
  }

  /**
   * 更新项目的 TypeScript 配置
   */
  @Put('project/:projectId/config')
  @ApiOperation({ summary: 'Update TypeScript config' })
  @ApiResponse({ status: 200, description: 'Config updated' })
  async updateConfig(
    @Param('projectId') projectId: string,
    @Body() updateDto: Omit<UpdateTypeScriptConfigDto, 'projectId'>,
  ) {
    return await this.typescriptService.updateTypeScriptConfig({
      projectId,
      ...updateDto,
    })
  }

  /**
   * 更新项目的 TypeScript 版本
   */
  @Put('project/:projectId/version')
  @ApiOperation({ summary: 'Update TypeScript version' })
  @ApiResponse({ status: 200, description: 'Version updated' })
  async updateVersion(
    @Param('projectId') projectId: string,
    @Body() updateDto: Omit<UpdateTypeScriptVersionDto, 'projectId'>,
  ) {
    return await this.typescriptService.updateTypeScriptVersion({
      projectId,
      ...updateDto,
    })
  }
}

