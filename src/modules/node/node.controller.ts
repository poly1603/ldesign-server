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
import { NodeService } from './node.service'
import { InstallNodeDto } from './dto/install-node.dto'
import { SwitchNodeDto } from './dto/switch-node.dto'
import { InstallManagerDto } from './dto/install-manager.dto'

/**
 * Node 版本管理控制器
 */
@Controller('node')
export class NodeController {
  constructor(private readonly nodeService: NodeService) {}

  /**
   * 获取已安装的 Node 版本列表
   * @returns Node 版本列表
   */
  @Get('versions')
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
  async listAvailableVersions() {
    const versions = await this.nodeService.listAvailableVersions()
    return {
      success: true,
      data: versions,
    }
  }
}

