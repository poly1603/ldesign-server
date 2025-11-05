import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { DepsService } from './deps.service.js'
import {
  AnalyzeDepsDto,
  CheckOutdatedDto,
  UpdateDepsDto,
  InstallDepsDto,
  AuditDepsDto,
  SearchPackageDto,
  PackageInfoDto,
} from './dto/deps.dto.js'

@ApiTags('deps')
@Controller('deps')
export class DepsController {
  constructor(private readonly depsService: DepsService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze project dependencies' })
  @ApiResponse({ status: 200, description: 'Dependencies analyzed' })
  async analyzeDeps(@Body() analyzeDto: AnalyzeDepsDto): Promise<any> {
    try {
      return await this.depsService.analyzeDeps(analyzeDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to analyze dependencies', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('outdated')
  @ApiOperation({ summary: 'Check for outdated dependencies' })
  @ApiResponse({ status: 200, description: 'Outdated dependencies checked' })
  async checkOutdated(@Body() checkDto: CheckOutdatedDto): Promise<any> {
    try {
      return await this.depsService.checkOutdated(checkDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to check outdated', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('update')
  @ApiOperation({ summary: 'Update dependencies' })
  @ApiResponse({ status: 200, description: 'Dependencies updated' })
  async updateDeps(@Body() updateDto: UpdateDepsDto): Promise<any> {
    try {
      return await this.depsService.updateDeps(updateDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to update dependencies', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('install')
  @ApiOperation({ summary: 'Install dependencies' })
  @ApiResponse({ status: 200, description: 'Dependencies installed' })
  async installDeps(@Body() installDto: InstallDepsDto): Promise<any> {
    try {
      return await this.depsService.installDeps(installDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to install dependencies', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('audit')
  @ApiOperation({ summary: 'Audit dependencies for vulnerabilities' })
  @ApiResponse({ status: 200, description: 'Dependencies audited' })
  async auditDeps(@Body() auditDto: AuditDepsDto): Promise<any> {
    try {
      return await this.depsService.auditDeps(auditDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to audit dependencies', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('search')
  @ApiOperation({ summary: 'Search npm packages' })
  @ApiResponse({ status: 200, description: 'Packages searched' })
  async searchPackage(@Body() searchDto: SearchPackageDto): Promise<any> {
    try {
      return await this.depsService.searchPackage(searchDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to search packages', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('package/info')
  @ApiOperation({ summary: 'Get package information' })
  @ApiResponse({ status: 200, description: 'Package info retrieved' })
  async getPackageInfo(@Body() packageDto: PackageInfoDto): Promise<any> {
    try {
      return await this.depsService.getPackageInfo(packageDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to get package info', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('clean-install')
  @ApiOperation({ summary: 'Clean node_modules and reinstall' })
  @ApiResponse({ status: 200, description: 'Clean install completed' })
  async cleanInstall(@Body() body: { projectPath: string }): Promise<any> {
    try {
      return await this.depsService.cleanInstall(body.projectPath)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to clean install', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('global')
  @ApiOperation({ summary: 'List globally installed packages' })
  @ApiResponse({ status: 200, description: 'Global packages listed' })
  async listGlobalPackages(): Promise<any> {
    try {
      return await this.depsService.listGlobalPackages()
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to list global packages', HttpStatus.BAD_REQUEST)
    }
  }
}
