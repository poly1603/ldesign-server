import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { BatchService } from './batch.service.js'
import {
  BatchCreateDto,
  BatchUpdateDto,
  BatchDeleteDto,
  BatchImportDto,
  BatchExportDto,
  BatchProcessDto,
  BatchStatusDto,
} from './dto/batch.dto.js'

@ApiTags('batch')
@Controller('batch')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Post('create')
  @ApiOperation({ summary: 'API Operation' })
  async batchCreate(@Body() dto: BatchCreateDto) {
    try {
      return await this.batchService.batchCreate(dto)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('update')
  @ApiOperation({ summary: 'API Operation' })
  async batchUpdate(@Body() dto: BatchUpdateDto) {
    try {
      return await this.batchService.batchUpdate(dto)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('delete')
  @ApiOperation({ summary: 'API Operation' })
  async batchDelete(@Body() dto: BatchDeleteDto) {
    try {
      return await this.batchService.batchDelete(dto)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('import')
  @ApiOperation({ summary: 'API Operation' })
  async batchImport(@Body() dto: BatchImportDto) {
    try {
      return await this.batchService.batchImport(dto)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('export')
  @ApiOperation({ summary: 'API Operation' })
  async batchExport(@Body() dto: BatchExportDto) {
    try {
      return await this.batchService.batchExport(dto)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('process')
  @ApiOperation({ summary: 'API Operation' })
  async batchProcess(@Body() dto: BatchProcessDto) {
    try {
      return await this.batchService.batchProcess(dto)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('status/:batchId')
  @ApiOperation({ summary: 'API Operation' })
  async getStatus(@Param('batchId') batchId: string) {
    try {
      return await this.batchService.getStatus(batchId)
    } catch (error: any) {
      throw new HttpException(error.message || '', HttpStatus.BAD_REQUEST)
    }
  }
}
