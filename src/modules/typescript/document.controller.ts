import { Controller, Get, Param } from '@nestjs/common'
import { DocumentService } from './document.service.js'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'

/**
 * 文档控制器
 */
@ApiTags('文档')
@Controller('api/documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  /**
   * 根据 ID 获取文档
   */
  @Get(':id')
  @ApiOperation({ summary: '根据 ID 获取文档' })
  @ApiResponse({ status: 200, description: '文档获取成功' })
  async getDocumentById(@Param('id') id: string) {
    const document = await this.documentService.getDocumentById(id)
    if (!document) {
      return {
        success: false,
        message: '文档不存在',
        data: null,
      }
    }
    return {
      success: true,
      data: document,
    }
  }

  /**
   * 获取 TypeScript 配置文档
   */
  @Get('typescript/config')
  @ApiOperation({ summary: '获取 TypeScript 配置文档' })
  @ApiResponse({ status: 200, description: '文档获取成功' })
  async getTypeScriptConfigDocument() {
    const document = await this.documentService.getTypeScriptConfigDocument()
    if (!document) {
      return {
        success: false,
        message: '文档不存在',
        data: null,
      }
    }
    return {
      success: true,
      data: document,
    }
  }

  /**
   * 获取 Package 配置文档
   */
  @Get('package/config')
  @ApiOperation({ summary: '获取 Package 配置文档' })
  @ApiResponse({ status: 200, description: '文档获取成功' })
  async getPackageConfigDocument() {
    const document = await this.documentService.getPackageConfigDocument()
    if (!document) {
      return {
        success: false,
        message: '文档不存在',
        data: null,
      }
    }
    return {
      success: true,
      data: document,
    }
  }
}

