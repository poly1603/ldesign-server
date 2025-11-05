import { 
  Controller, 
  Post, 
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { TranslatorService } from './translator.service.js'
import {
  TranslateTextDto,
  TranslateFileDto,
  BatchTranslateDto,
  DetectLanguageDto,
  ManageTranslationKeysDto,
  SyncTranslationsDto,
  ValidateTranslationsDto,
  ExportTranslationsDto,
  GetTranslationStatsDto,
} from './dto/translator.dto.js'

@ApiTags('translator')
@Controller('translator')
export class TranslatorController {
  constructor(private readonly translatorService: TranslatorService) {}

  @Post('translate')
  @ApiOperation({ summary: 'Translate text' })
  @ApiResponse({ status: 200, description: 'Text translated' })
  async translateText(@Body() translateDto: TranslateTextDto) {
    try {
      return await this.translatorService.translateText(translateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Translation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('file')
  @ApiOperation({ summary: 'Translate file' })
  @ApiResponse({ status: 200, description: 'File translated' })
  async translateFile(@Body() fileDto: TranslateFileDto) {
    try {
      return await this.translatorService.translateFile(fileDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'File translation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch translate' })
  @ApiResponse({ status: 200, description: 'Batch translation completed' })
  async batchTranslate(@Body() batchDto: BatchTranslateDto) {
    try {
      return await this.translatorService.batchTranslate(batchDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Batch translation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('detect')
  @ApiOperation({ summary: 'Detect language' })
  @ApiResponse({ status: 200, description: 'Language detected' })
  async detectLanguage(@Body() detectDto: DetectLanguageDto) {
    try {
      return await this.translatorService.detectLanguage(detectDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Language detection failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('keys')
  @ApiOperation({ summary: 'Manage translation keys' })
  @ApiResponse({ status: 200, description: 'Keys managed' })
  async manageTranslationKeys(@Body() manageDto: ManageTranslationKeysDto) {
    try {
      return await this.translatorService.manageTranslationKeys(manageDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to manage translation keys',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync translations' })
  @ApiResponse({ status: 200, description: 'Translations synced' })
  async syncTranslations(@Body() syncDto: SyncTranslationsDto) {
    try {
      return await this.translatorService.syncTranslations(syncDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Translation sync failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate translations' })
  @ApiResponse({ status: 200, description: 'Validation completed' })
  async validateTranslations(@Body() validateDto: ValidateTranslationsDto) {
    try {
      return await this.translatorService.validateTranslations(validateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Translation validation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('export')
  @ApiOperation({ summary: 'Export translations' })
  @ApiResponse({ status: 200, description: 'Translations exported' })
  async exportTranslations(@Body() exportDto: ExportTranslationsDto) {
    try {
      return await this.translatorService.exportTranslations(exportDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Translation export failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('stats')
  @ApiOperation({ summary: 'Get translation statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getTranslationStats(@Body() statsDto: GetTranslationStatsDto) {
    try {
      return await this.translatorService.getTranslationStats(statsDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get translation statistics',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
