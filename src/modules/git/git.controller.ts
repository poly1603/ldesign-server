import { Controller, Get, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { GitService } from './git.service.js'
import { ReinstallGitDto } from './dto/reinstall-git.dto.js'

/**
 * Git 管理控制器
 */
@ApiTags('git')
@Controller('api/git')
export class GitController {
  constructor(private readonly gitService: GitService) {}

  /**
   * 检测 Git 安装状态和版本
   * @returns Git 状态信息
   */
  @Get('status')
  @ApiOperation({ summary: 'Get Git installation status' })
  @ApiResponse({ status: 200, description: 'Git status retrieved' })
  async getStatus() {
    const status = await this.gitService.getStatus()
    return {
      success: true,
      data: status,
    }
  }

  /**
   * 获取 Git 配置信息
   * @returns Git 配置
   */
  @Get('config')
  @ApiOperation({ summary: 'Get Git configuration' })
  @ApiResponse({ status: 200, description: 'Git config retrieved' })
  async getConfig() {
    const config = await this.gitService.getConfig()
    return {
      success: true,
      data: config,
    }
  }

  /**
   * 重新安装 Git
   * @param reinstallGitDto - 重装 Git DTO
   * @returns 安装结果
   */
  @Post('reinstall')
  @ApiOperation({ summary: 'Reinstall Git' })
  @ApiResponse({ status: 200, description: 'Git reinstalled' })
  async reinstall(@Body() reinstallGitDto: ReinstallGitDto) {
    const result = await this.gitService.reinstall(reinstallGitDto.packageManager)
    return {
      success: result.success,
      message: result.message,
    }
  }
}

