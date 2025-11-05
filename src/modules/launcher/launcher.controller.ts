import { Controller, Post, Get, Delete, Body, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { LauncherService } from './launcher.service.js'
import { LaunchAppDto, KillProcessDto, FindProcessDto } from './dto/launcher.dto.js'

@ApiTags('launcher')
@Controller('launcher')
export class LauncherController {
  constructor(private readonly launcherService: LauncherService) {}

  @Post('launch')
  @ApiOperation({ summary: 'Launch application or command' })
  @ApiResponse({ status: 200, description: 'Application launched' })
  async launchApp(@Body() launchDto: LaunchAppDto): Promise<any> {
    try {
      return await this.launcherService.launchApp(launchDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to launch app', HttpStatus.BAD_REQUEST)
    }
  }

  @Delete('kill')
  @ApiOperation({ summary: 'Kill process by PID' })
  @ApiResponse({ status: 200, description: 'Process killed' })
  async killProcess(@Body() killDto: KillProcessDto): Promise<any> {
    try {
      return await this.launcherService.killProcess(killDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to kill process', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('processes')
  @ApiOperation({ summary: 'List system processes' })
  @ApiResponse({ status: 200, description: 'Processes listed' })
  async listProcesses(): Promise<any> {
    try {
      return await this.launcherService.listProcesses()
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to list processes', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('find')
  @ApiOperation({ summary: 'Find process by name' })
  @ApiResponse({ status: 200, description: 'Process found' })
  async findProcess(@Body() findDto: FindProcessDto): Promise<any> {
    try {
      return await this.launcherService.findProcess(findDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to find process', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('running')
  @ApiOperation({ summary: 'Get processes launched by this service' })
  @ApiResponse({ status: 200, description: 'Running processes retrieved' })
  async getRunningProcesses(): Promise<any> {
    try {
      return await this.launcherService.getRunningProcesses()
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to get running processes', HttpStatus.BAD_REQUEST)
    }
  }
}
