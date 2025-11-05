import { Controller, Post, Get, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { DatabaseService } from './database.service.js'
import {
  CreateBackupDto, RestoreBackupDto, ExecuteQueryDto, GetTableInfoDto,
  OptimizeDatabaseDto, ExportDataDto, ImportDataDto, CleanupDataDto,
} from './dto/database.dto.js'

@ApiTags('database')
@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Post('backup')
  @ApiOperation({ summary: 'Create database backup' })
  @ApiResponse({ status: 200, description: 'Backup created' })
  async createBackup(@Body() backupDto: CreateBackupDto) {
    try {
      return await this.databaseService.createBackup(backupDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Backup failed', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('backups')
  @ApiOperation({ summary: 'List backups' })
  @ApiResponse({ status: 200, description: 'Backups listed' })
  async listBackups() {
    try {
      return await this.databaseService.listBackups()
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed to list', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('restore')
  @ApiOperation({ summary: 'Restore backup' })
  @ApiResponse({ status: 200, description: 'Backup restored' })
  async restoreBackup(@Body() restoreDto: RestoreBackupDto) {
    try {
      return await this.databaseService.restoreBackup(restoreDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Restore failed', HttpStatus.BAD_REQUEST)
    }
  }

  @Delete('backup/:name')
  @ApiOperation({ summary: 'Delete backup' })
  @ApiResponse({ status: 200, description: 'Backup deleted' })
  async deleteBackup(@Param('name') name: string) {
    try {
      return await this.databaseService.deleteBackup(name)
    } catch (error: any) {
      throw new HttpException(error.message || 'Delete failed', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('query')
  @ApiOperation({ summary: 'Execute SQL query' })
  @ApiResponse({ status: 200, description: 'Query executed' })
  async executeQuery(@Body() queryDto: ExecuteQueryDto) {
    try {
      return await this.databaseService.executeQuery(queryDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Query failed', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('schema')
  @ApiOperation({ summary: 'Get database schema' })
  @ApiResponse({ status: 200, description: 'Schema retrieved' })
  async getSchema() {
    try {
      return await this.databaseService.getSchema()
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('table-info')
  @ApiOperation({ summary: 'Get table information' })
  @ApiResponse({ status: 200, description: 'Table info retrieved' })
  async getTableInfo(@Body() tableDto: GetTableInfoDto) {
    try {
      return await this.databaseService.getTableInfo(tableDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('optimize')
  @ApiOperation({ summary: 'Optimize database' })
  @ApiResponse({ status: 200, description: 'Database optimized' })
  async optimize(@Body() optimizeDto: OptimizeDatabaseDto) {
    try {
      return await this.databaseService.optimize(optimizeDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Optimize failed', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('export')
  @ApiOperation({ summary: 'Export data' })
  @ApiResponse({ status: 200, description: 'Data exported' })
  async exportData(@Body() exportDto: ExportDataDto) {
    try {
      return await this.databaseService.exportData(exportDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Export failed', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('import')
  @ApiOperation({ summary: 'Import data' })
  @ApiResponse({ status: 200, description: 'Data imported' })
  async importData(@Body() importDto: ImportDataDto) {
    try {
      return await this.databaseService.importData(importDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Import failed', HttpStatus.BAD_REQUEST)
    }
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Cleanup data' })
  @ApiResponse({ status: 200, description: 'Cleanup completed' })
  async cleanupData(@Body() cleanupDto: CleanupDataDto) {
    try {
      return await this.databaseService.cleanupData(cleanupDto)
    } catch (error: any) {
      throw new HttpException(error.message || 'Cleanup failed', HttpStatus.BAD_REQUEST)
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get database statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStatistics() {
    try {
      return await this.databaseService.getStatistics()
    } catch (error: any) {
      throw new HttpException(error.message || 'Failed', HttpStatus.BAD_REQUEST)
    }
  }
}