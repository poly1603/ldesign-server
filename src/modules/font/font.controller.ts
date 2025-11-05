import { Controller, Post, Get, Body, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { FontService } from './font.service.js'
import {
  ExtractFontDto,
  ExtractFontFromFilesDto,
  OptimizeFontDto,
  ConvertFontDto,
  AnalyzeFontDto,
} from './dto/font.dto.js'

@ApiTags('font')
@Controller('font')
export class FontController {
  constructor(private readonly fontService: FontService) {}

  @Post('extract')
  @ApiOperation({ summary: 'Extract font subset from specific text' })
  @ApiResponse({ status: 200, description: 'Font extracted' })
  async extractFont(@Body() extractDto: ExtractFontDto): Promise<any> {
    try {
      return await this.fontService.extractFont(extractDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to extract font', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('extract/files')
  @ApiOperation({ summary: 'Extract font by scanning text files' })
  @ApiResponse({ status: 200, description: 'Font extracted from files' })
  async extractFontFromFiles(@Body() extractDto: ExtractFontFromFilesDto): Promise<any> {
    try {
      return await this.fontService.extractFontFromFiles(extractDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to extract font from files',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('optimize')
  @ApiOperation({ summary: 'Optimize font file (reduce size)' })
  @ApiResponse({ status: 200, description: 'Font optimized' })
  async optimizeFont(@Body() optimizeDto: OptimizeFontDto): Promise<any> {
    try {
      return await this.fontService.optimizeFont(optimizeDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to optimize font', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('convert')
  @ApiOperation({ summary: 'Convert font to different format' })
  @ApiResponse({ status: 200, description: 'Font converted' })
  async convertFont(@Body() convertDto: ConvertFontDto): Promise<any> {
    try {
      return await this.fontService.convertFont(convertDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to convert font', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze font file metadata' })
  @ApiResponse({ status: 200, description: 'Font analyzed' })
  async analyzeFont(@Body() analyzeDto: AnalyzeFontDto): Promise<any> {
    try {
      return await this.fontService.analyzeFont(analyzeDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to analyze font', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('fontmin/check')
  @ApiOperation({ summary: 'Check if fontmin is installed' })
  @ApiResponse({ status: 200, description: 'Installation status checked' })
  async checkFontminInstallation(): Promise<any> {
    try {
      return await this.fontService.checkFontminInstallation()
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to check fontmin installation',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('fontmin/install')
  @ApiOperation({ summary: 'Install fontmin globally' })
  @ApiResponse({ status: 200, description: 'Fontmin installed' })
  async installFontmin(): Promise<any> {
    try {
      return await this.fontService.installFontmin()
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to install fontmin', HttpStatus.BAD_REQUEST)
    }
  }
}
