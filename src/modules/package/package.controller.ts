import { Controller, Get, Put, Post, Body, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { PackageService } from './package.service.js'
import { GetPackageConfigDto, UpdatePackageConfigDto } from './dto/package-config.dto.js'

/**
 * Package 配置控制器
 */
@ApiTags('package')
@Controller('api/package')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  /**
   * 获取配置 Schema
   */
  @Get('schema')
  @ApiOperation({ summary: 'Get package.json config schema' })
  @ApiResponse({ status: 200, description: 'Schema retrieved' })
  async getSchema() {
    const schema = await this.packageService.getConfigSchema()
    return {
      success: true,
      data: schema,
    }
  }

  /**
   * 获取项目的 package.json
   */
  @Get('project/:projectId/config')
  @ApiOperation({ summary: 'Get project package.json config' })
  @ApiResponse({ status: 200, description: 'Config retrieved' })
  async getConfig(@Param('projectId') projectId: string) {
    const dto: GetPackageConfigDto = { projectId }
    const result = await this.packageService.getPackageConfig(dto)
    return result
  }

  /**
   * 更新项目的 package.json
   */
  @Put('project/:projectId/config')
  @ApiOperation({ summary: 'Update project package.json config' })
  @ApiResponse({ status: 200, description: 'Config updated' })
  async updateConfig(
    @Param('projectId') projectId: string,
    @Body() body: { config: Record<string, any> },
  ) {
    const dto: UpdatePackageConfigDto = {
      projectId,
      config: body.config,
    }
    const result = await this.packageService.updatePackageConfig(dto)
    return result
  }

  /**
   * 获取项目的当前版本号
   */
  @Get('project/:projectId/version')
  @ApiOperation({ summary: 'Get project current version' })
  @ApiResponse({ status: 200, description: 'Version retrieved' })
  async getVersion(@Param('projectId') projectId: string) {
    const result = await this.packageService.getCurrentVersion(projectId)
    return {
      success: true,
      data: result,
    }
  }

  /**
   * 更新项目的版本号
   */
  @Post('project/:projectId/version')
  @ApiOperation({ summary: 'Update project version' })
  @ApiResponse({ status: 200, description: 'Version updated' })
  async updateVersion(
    @Param('projectId') projectId: string,
    @Body() body: { version: string },
  ) {
    const result = await this.packageService.updateVersion(projectId, body.version)
    return {
      success: true,
      data: result,
      message: `版本已更新: ${result.oldVersion} -> ${result.newVersion}`,
    }
  }

  /**
   * 获取所有版本提升选项
   */
  @Get('version-bump-options')
  @ApiOperation({ summary: 'Get all version bump options' })
  @ApiResponse({ status: 200, description: 'Version bump options retrieved' })
  async getVersionBumpOptions() {
    const options = await this.packageService.getVersionBumpOptions()
    return {
      success: true,
      data: options,
    }
  }

  /**
   * 获取所有 Builder 输出目录配置
   */
  @Get('builder-output-dirs')
  @ApiOperation({ summary: 'Get all builder output directories configuration' })
  @ApiResponse({ status: 200, description: 'Builder output dirs retrieved' })
  async getBuilderOutputDirs() {
    const dirs = await this.packageService.getBuilderOutputDirs()
    return {
      success: true,
      data: dirs,
    }
  }

  /**
   * 更新 Builder 输出目录配置
   */
  @Put('builder-output-dirs')
  @ApiOperation({ summary: 'Update builder output directories configuration' })
  @ApiResponse({ status: 200, description: 'Builder output dirs updated' })
  async updateBuilderOutputDirs(@Body() body: { dirs: Array<{
    name: string
    label?: string
    description?: string
    enabled?: boolean
    order?: number
  }> }) {
    const dirs = await this.packageService.updateBuilderOutputDirs(body.dirs)
    return {
      success: true,
      data: dirs,
      message: '输出目录配置已更新',
    }
  }
}

