import { Injectable, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Document } from './entities/document.entity.js'
import { TYPESCRIPT_CONFIG_DOCUMENT } from './typescript-config-document.js'
import { PACKAGE_CONFIG_DOCUMENT } from '../package/package-config-document.js'

/**
 * 文档服务
 */
@Injectable()
export class DocumentService implements OnModuleInit {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  /**
   * 模块初始化时，确保文档存在
   */
  async onModuleInit() {
    await Promise.all([
      this.ensureTypeScriptDocumentExists(),
      this.ensurePackageDocumentExists(),
    ])
  }

  /**
   * 确保 TypeScript 配置文档存在
   */
  private async ensureTypeScriptDocumentExists(): Promise<void> {
    const existingDoc = await this.documentRepository.findOne({
      where: { id: 'typescript-config-guide' },
    })

    if (!existingDoc) {
      const document = this.documentRepository.create({
        id: 'typescript-config-guide',
        type: 'typescript-config',
        title: 'TypeScript 配置完全指南',
        description: '详细的 tsconfig.json 配置解析文档，包含所有配置项的说明和示例',
        content: TYPESCRIPT_CONFIG_DOCUMENT,
        version: '1.0.0',
      })
      await this.documentRepository.save(document)
      console.log('TypeScript 配置文档已初始化')
    }
  }

  /**
   * 确保 Package 配置文档存在
   */
  private async ensurePackageDocumentExists(): Promise<void> {
    const existingDoc = await this.documentRepository.findOne({
      where: { id: 'package-config-guide' },
    })

    if (!existingDoc) {
      const document = this.documentRepository.create({
        id: 'package-config-guide',
        type: 'package-config',
        title: 'Package.json 配置完全指南',
        description: '详细的 package.json 配置解析文档，包含所有字段的说明和示例',
        content: PACKAGE_CONFIG_DOCUMENT,
        version: '1.0.0',
      })
      await this.documentRepository.save(document)
      console.log('Package 配置文档已初始化')
    }
  }

  /**
   * 根据 ID 获取文档
   */
  async getDocumentById(id: string): Promise<Document | null> {
    return this.documentRepository.findOne({
      where: { id },
    })
  }

  /**
   * 根据类型获取文档
   */
  async getDocumentsByType(type: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { type: type as any },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * 获取 TypeScript 配置文档
   */
  async getTypeScriptConfigDocument(): Promise<Document | null> {
    return this.getDocumentById('typescript-config-guide')
  }

  /**
   * 获取 Package 配置文档
   */
  async getPackageConfigDocument(): Promise<Document | null> {
    return this.getDocumentById('package-config-guide')
  }
}

