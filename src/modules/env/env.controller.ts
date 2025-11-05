import { 
  Controller, 
  Post, 
  Get,
  Delete,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { EnvService } from './env.service.js'
import {
  GetEnvDto,
  SetEnvDto,
  DeleteEnvDto,
  ValidateEnvDto,
  SyncEnvDto,
  ImportEnvDto,
  ExportEnvDto,
  GenerateEnvConfigDto,
  EncryptEnvDto,
  CompareEnvDto,
} from './dto/env.dto.js'

@ApiTags('env')
@Controller('env')
export class EnvController {
  constructor(private readonly envService: EnvService) {}

  @Post('get')
  @ApiOperation({ summary: 'Get environment variables' })
  @ApiResponse({ status: 200, description: 'Environment variables retrieved' })
  async getEnv(@Body() getDto: GetEnvDto) {
    try {
      return await this.envService.getEnv(getDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get environment variables',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('set')
  @ApiOperation({ summary: 'Set environment variable' })
  @ApiResponse({ status: 200, description: 'Environment variable set' })
  async setEnv(@Body() setDto: SetEnvDto) {
    try {
      return await this.envService.setEnv(setDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to set environment variable',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Delete('delete')
  @ApiOperation({ summary: 'Delete environment variable' })
  @ApiResponse({ status: 200, description: 'Environment variable deleted' })
  async deleteEnv(@Body() deleteDto: DeleteEnvDto) {
    try {
      return await this.envService.deleteEnv(deleteDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to delete environment variable',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate environment variables' })
  @ApiResponse({ status: 200, description: 'Validation completed' })
  async validateEnv(@Body() validateDto: ValidateEnvDto) {
    try {
      return await this.envService.validateEnv(validateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Environment validation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync environment variables between environments' })
  @ApiResponse({ status: 200, description: 'Environment variables synced' })
  async syncEnv(@Body() syncDto: SyncEnvDto) {
    try {
      return await this.envService.syncEnv(syncDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Environment sync failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('import')
  @ApiOperation({ summary: 'Import environment variables from file' })
  @ApiResponse({ status: 200, description: 'Environment variables imported' })
  async importEnv(@Body() importDto: ImportEnvDto) {
    try {
      return await this.envService.importEnv(importDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Environment import failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('export')
  @ApiOperation({ summary: 'Export environment variables to file' })
  @ApiResponse({ status: 200, description: 'Environment variables exported' })
  async exportEnv(@Body() exportDto: ExportEnvDto) {
    try {
      return await this.envService.exportEnv(exportDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Environment export failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate environment configuration' })
  @ApiResponse({ status: 200, description: 'Configuration generated' })
  async generateConfig(@Body() generateDto: GenerateEnvConfigDto) {
    try {
      return await this.envService.generateConfig(generateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Configuration generation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('encrypt')
  @ApiOperation({ summary: 'Encrypt environment variables' })
  @ApiResponse({ status: 200, description: 'Variables encrypted' })
  async encryptEnv(@Body() encryptDto: EncryptEnvDto) {
    try {
      return await this.envService.encryptEnv(encryptDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Encryption failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare environment variables' })
  @ApiResponse({ status: 200, description: 'Comparison completed' })
  async compareEnv(@Body() compareDto: CompareEnvDto) {
    try {
      return await this.envService.compareEnv(compareDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Environment comparison failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
