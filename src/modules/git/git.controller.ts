import { Controller, Get, Post, Body } from '@nestjs/common'
import { GitService } from './git.service'
import { ReinstallGitDto } from './dto/reinstall-git.dto'

/**
 * Git 管理控制器
 */
@Controller('git')
export class GitController {
  constructor(private readonly gitService: GitService) {}

  /**
   * 检测 Git 安装状态和版本
   * @returns Git 状态信息
   */
  @Get('status')
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
  async reinstall(@Body() reinstallGitDto: ReinstallGitDto) {
    const result = await this.gitService.reinstall(reinstallGitDto.packageManager)
    return {
      success: result.success,
      message: result.message,
    }
  }
}

