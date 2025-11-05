import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { NodeService } from './node.service.js'
import { InstallNodeDto } from './dto/install-node.dto.js'
import { SwitchNodeDto } from './dto/switch-node.dto.js'
import { InstallManagerDto } from './dto/install-manager.dto.js'

/**
 * Node 版本管理控制器
 */
@ApiTags('node')
@Controller('api/node')
export class NodeController {
  constructor(private readonly nodeService: NodeService) {}

  /**
   * 获取已安装的 Node 版本列表
   * @returns Node 版本列表
   */
  @Get('versions')
  @ApiOperation({ summary: 'List installed Node versions' })
  @ApiResponse({ status: 200, description: 'Versions listed' })
  async listVersions() {
    const versions = await this.nodeService.listVersions()
    return {
      success: true,
      data: versions,
    }
  }

  /**
   * 获取当前使用的 Node 版本
   * @returns 当前版本
   */
  @Get('current')
  @ApiOperation({ summary: 'Get current Node version' })
  @ApiResponse({ status: 200, description: 'Current version retrieved' })
  async getCurrentVersion() {
    const version = await this.nodeService.getCurrentVersion()
    return {
      success: true,
      data: {
        version,
      },
    }
  }

  /**
   * 获取可用的版本管理工具列表
   * @returns 管理器列表
   */
  @Get('managers')
  @ApiOperation({ summary: 'Get available Node managers' })
  @ApiResponse({ status: 200, description: 'Managers listed' })
  async getAvailableManagers() {
    const managers = await this.nodeService.getAvailableManagers()
    return {
      success: true,
      data: managers,
    }
  }

  /**
   * 检测已安装的版本管理工具状态
   * @returns 管理器状态列表
   */
  @Get('manager/status')
  @ApiOperation({ summary: 'Get Node managers status' })
  @ApiResponse({ status: 200, description: 'Status retrieved' })
  async getManagersStatus() {
    const statuses = await this.nodeService.getManagersStatus()
    return {
      success: true,
      data: statuses,
    }
  }

  /**
   * 安装指定的版本管理工具
   * @param installManagerDto - 安装管理器 DTO
   * @returns 安装结果
   */
  @Post('manager/install')
  @ApiOperation({ summary: 'Install Node manager' })
  @ApiResponse({ status: 201, description: 'Manager installed' })
  @HttpCode(HttpStatus.CREATED)
  async installManager(@Body() installManagerDto: InstallManagerDto) {
    const result = await this.nodeService.installManager(installManagerDto.managerType)
    return {
      success: result.success,
      message: result.message,
    }
  }

  /**
   * 安装指定版本的 Node.js
   * @param installNodeDto - 安装 Node DTO
   * @returns 安装结果
   */
  @Post('install')
  @ApiOperation({ summary: 'Install Node version' })
  @ApiResponse({ status: 200, description: 'Version installed' })
  async installVersion(@Body() installNodeDto: InstallNodeDto) {
    const result = await this.nodeService.installVersion(installNodeDto.version)
    return {
      success: result.success,
      message: result.message,
    }
  }

  /**
   * 切换到指定版本
   * @param switchNodeDto - 切换 Node DTO
   * @returns 切换结果
   */
  @Post('switch')
  @ApiOperation({ summary: 'Switch Node version' })
  @ApiResponse({ status: 200, description: 'Version switched' })
  async switchVersion(@Body() switchNodeDto: SwitchNodeDto) {
    const result = await this.nodeService.switchVersion(switchNodeDto.version)
    return {
      success: result.success,
      message: result.message,
    }
  }

  /**
   * 删除指定版本
   * @param version - 要删除的版本
   * @returns 删除结果
   */
  @Delete('versions/:version')
  @ApiOperation({ summary: 'Remove Node version' })
  @ApiResponse({ status: 200, description: 'Version removed' })
  async removeVersion(@Param('version') version: string) {
    const result = await this.nodeService.removeVersion(version)
    return {
      success: result.success,
      message: result.message,
    }
  }

  /**
   * 获取可用版本列表（从远程）
   * @returns 可用版本列表
   */
  @Get('versions/available')
  @ApiOperation({ summary: 'List available Node versions' })
  @ApiResponse({ status: 200, description: 'Available versions listed' })
  async listAvailableVersions() {
    const versions = await this.nodeService.listAvailableVersions()
    return {
      success: true,
      data: versions,
    }
  }

}

