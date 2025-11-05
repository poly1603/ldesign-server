import { 
  Controller, 
  Post, 
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { FormatterService } from './formatter.service.js'
import {
  FormatFilesDto,
  CheckFormatDto,
  ConfigureFormatterDto,
  LintCodeDto,
  SortImportsDto,
  OrganizeCodeDto,
  BeautifyCodeDto,
  MinifyCodeDto,
  GenerateEditorConfigDto,
} from './dto/formatter.dto.js'

@ApiTags('formatter')
@Controller('formatter')
export class FormatterController {
  constructor(private readonly formatterService: FormatterService) {}

  @Post('format')
  @ApiOperation({ summary: 'Format code files' })
  @ApiResponse({ status: 200, description: 'Files formatted successfully' })
  async formatFiles(@Body() formatDto: FormatFilesDto) {
    try {
      return await this.formatterService.formatFiles(formatDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Formatting failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('check')
  @ApiOperation({ summary: 'Check code formatting' })
  @ApiResponse({ status: 200, description: 'Format check completed' })
  async checkFormat(@Body() checkDto: CheckFormatDto) {
    try {
      return await this.formatterService.checkFormat(checkDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Format check failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('configure')
  @ApiOperation({ summary: 'Configure formatter' })
  @ApiResponse({ status: 200, description: 'Formatter configured' })
  async configureFormatter(@Body() configDto: ConfigureFormatterDto) {
    try {
      return await this.formatterService.configureFormatter(configDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Configuration failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('lint')
  @ApiOperation({ summary: 'Lint code' })
  @ApiResponse({ status: 200, description: 'Linting completed' })
  async lintCode(@Body() lintDto: LintCodeDto) {
    try {
      return await this.formatterService.lintCode(lintDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Linting failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('sort-imports')
  @ApiOperation({ summary: 'Sort import statements' })
  @ApiResponse({ status: 200, description: 'Imports sorted' })
  async sortImports(@Body() sortDto: SortImportsDto) {
    try {
      return await this.formatterService.sortImports(sortDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Import sorting failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('organize')
  @ApiOperation({ summary: 'Organize code structure' })
  @ApiResponse({ status: 200, description: 'Code organized' })
  async organizeCode(@Body() organizeDto: OrganizeCodeDto) {
    try {
      return await this.formatterService.organizeCode(organizeDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Code organization failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('beautify')
  @ApiOperation({ summary: 'Beautify code' })
  @ApiResponse({ status: 200, description: 'Code beautified' })
  async beautifyCode(@Body() beautifyDto: BeautifyCodeDto) {
    try {
      return await this.formatterService.beautifyCode(beautifyDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Beautification failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('minify')
  @ApiOperation({ summary: 'Minify code' })
  @ApiResponse({ status: 200, description: 'Code minified' })
  async minifyCode(@Body() minifyDto: MinifyCodeDto) {
    try {
      return await this.formatterService.minifyCode(minifyDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Minification failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('editorconfig')
  @ApiOperation({ summary: 'Generate EditorConfig file' })
  @ApiResponse({ status: 200, description: 'EditorConfig generated' })
  async generateEditorConfig(@Body() generateDto: GenerateEditorConfigDto) {
    try {
      return await this.formatterService.generateEditorConfig(generateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'EditorConfig generation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
