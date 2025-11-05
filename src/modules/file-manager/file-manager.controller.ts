import { 
  Controller, 
  Post, 
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { FileManagerService } from './file-manager.service.js'
import {
  ListFilesDto,
  SearchFilesDto,
  FileOperationDto,
  BatchOperationDto,
  CompressFilesDto,
  ExtractFilesDto,
  CreateDirectoryDto,
  GetFileInfoDto,
} from './dto/file-manager.dto.js'

@ApiTags('file-manager')
@Controller('file-manager')
export class FileManagerController {
  constructor(private readonly fileManagerService: FileManagerService) {}

  @Post('list')
  @ApiOperation({ summary: 'List files in directory' })
  @ApiResponse({ status: 200, description: 'Files listed' })
  async listFiles(@Body() listDto: ListFilesDto) {
    try {
      return await this.fileManagerService.listFiles(listDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to list files',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('search')
  @ApiOperation({ summary: 'Search files' })
  @ApiResponse({ status: 200, description: 'Search completed' })
  async searchFiles(@Body() searchDto: SearchFilesDto) {
    try {
      return await this.fileManagerService.searchFiles(searchDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Search failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('info')
  @ApiOperation({ summary: 'Get file information' })
  @ApiResponse({ status: 200, description: 'File info retrieved' })
  async getFileInfo(@Body() infoDto: GetFileInfoDto) {
    try {
      return await this.fileManagerService.getFileInfo(infoDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to get file info',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('operation')
  @ApiOperation({ summary: 'Perform file operation (copy/move/delete/rename)' })
  @ApiResponse({ status: 200, description: 'Operation completed' })
  async fileOperation(@Body() opDto: FileOperationDto) {
    try {
      return await this.fileManagerService.fileOperation(opDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'File operation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch file operations' })
  @ApiResponse({ status: 200, description: 'Batch operation completed' })
  async batchOperation(@Body() batchDto: BatchOperationDto) {
    try {
      return await this.fileManagerService.batchOperation(batchDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Batch operation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('compress')
  @ApiOperation({ summary: 'Compress files' })
  @ApiResponse({ status: 200, description: 'Files compressed' })
  async compressFiles(@Body() compressDto: CompressFilesDto) {
    try {
      return await this.fileManagerService.compressFiles(compressDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Compression failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('extract')
  @ApiOperation({ summary: 'Extract archive' })
  @ApiResponse({ status: 200, description: 'Archive extracted' })
  async extractFiles(@Body() extractDto: ExtractFilesDto) {
    try {
      return await this.fileManagerService.extractFiles(extractDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Extraction failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('mkdir')
  @ApiOperation({ summary: 'Create directory' })
  @ApiResponse({ status: 200, description: 'Directory created' })
  async createDirectory(@Body() dirDto: CreateDirectoryDto) {
    try {
      return await this.fileManagerService.createDirectory(dirDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to create directory',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
