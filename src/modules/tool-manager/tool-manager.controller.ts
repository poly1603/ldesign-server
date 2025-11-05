import { Controller, Post, Get, Delete, Body, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ToolManagerService } from './tool-manager.service.js'
import { InstallToolDto, UninstallToolDto, CheckToolDto, UpdateToolDto } from './dto/tool-manager.dto.js'

@ApiTags('tool-manager')
@Controller('tool-manager')
export class ToolManagerController {
  constructor(private readonly toolManagerService: ToolManagerService) {}

  @Post('install')
  @ApiOperation({ summary: 'Install development tool (Node/Git/NVM/etc)' })
  @ApiResponse({ status: 200, description: 'Tool installed' })
  async installTool(@Body() installDto: InstallToolDto): Promise<any> {
    try {
      return await this.toolManagerService.installTool(installDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to install tool', HttpStatus.BAD_REQUEST)
    }
  }

  @Delete('uninstall')
  @ApiOperation({ summary: 'Uninstall development tool' })
  @ApiResponse({ status: 200, description: 'Tool uninstalled' })
  async uninstallTool(@Body() uninstallDto: UninstallToolDto): Promise<any> {
    try {
      return await this.toolManagerService.uninstallTool(uninstallDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to uninstall tool', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('check')
  @ApiOperation({ summary: 'Check if tool is installed' })
  @ApiResponse({ status: 200, description: 'Tool status checked' })
  async checkTool(@Body() checkDto: CheckToolDto): Promise<any> {
    try {
      return await this.toolManagerService.checkTool(checkDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to check tool', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('update')
  @ApiOperation({ summary: 'Update tool to latest or specific version' })
  @ApiResponse({ status: 200, description: 'Tool updated' })
  async updateTool(@Body() updateDto: UpdateToolDto): Promise<any> {
    try {
      return await this.toolManagerService.updateTool(updateDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to update tool', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('status/all')
  @ApiOperation({ summary: 'Get all supported tools installation status' })
  @ApiResponse({ status: 200, description: 'All tools status retrieved' })
  async getAllToolsStatus(): Promise<any> {
    try {
      return await this.toolManagerService.getAllToolsStatus()
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to get tools status', HttpStatus.BAD_REQUEST)
    }
  }
}
