import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { promises as fs } from 'fs'
import { join, resolve } from 'path'
import { ProjectService } from '../project/project.service.js'
import {
  GetTypeScriptConfigDto,
  UpdateTypeScriptConfigDto,
  UpdateTypeScriptVersionDto,
} from './dto/typescript-config.dto.js'
import { TYPESCRIPT_CONFIG_SCHEMA, ConfigOptionSchema, CATEGORY_LABELS } from './typescript-config-schema.js'

/**
 * TypeScript 配置服务
 */
@Injectable()
export class TypeScriptService {
  private readonly logger = new Logger(TypeScriptService.name)

  // TypeScript 支持的所有版本列表（从 npm 获取的最新版本）
  private readonly typescriptVersions = [
    '5.7.3',
    '5.7.2',
    '5.7.1',
    '5.6.3',
    '5.6.2',
    '5.6.1',
    '5.5.4',
    '5.5.3',
    '5.5.2',
    '5.4.5',
    '5.4.4',
    '5.4.3',
    '5.3.3',
    '5.3.2',
    '5.2.2',
    '5.1.6',
    '5.0.4',
    '4.9.5',
    '4.8.4',
    '4.7.4',
    '4.6.4',
    '4.5.5',
    '4.4.4',
    '4.3.5',
    '4.2.4',
    '4.1.5',
    '4.0.5',
    '3.9.10',
    '3.8.3',
    '3.7.5',
  ]

  constructor(
    private readonly projectService: ProjectService,
  ) {}

  /**
   * 获取支持的 TypeScript 版本列表
   */
  async getAvailableVersions(): Promise<string[]> {
    return this.typescriptVersions
  }

  /**
   * 获取 TypeScript 配置 Schema（根据版本过滤并按分类分组）
   * @param version - TypeScript 版本（可选，如果不提供则返回所有配置项）
   */
  async getConfigSchema(version?: string): Promise<Record<string, { label: string; options: ConfigOptionSchema[] }>> {
    // 根据版本过滤配置项
    let filteredSchema = TYPESCRIPT_CONFIG_SCHEMA

    if (version) {
      const versionParts = version.split('.').map(Number)
      const major = versionParts[0] || 0
      const minor = versionParts[1] || 0
      const patch = versionParts[2] || 0

      filteredSchema = TYPESCRIPT_CONFIG_SCHEMA.filter((option) => {
        // 如果配置项有 introducedIn，检查版本是否支持
        if (option.introducedIn) {
          const introParts = option.introducedIn.split('.').map(Number)
          const introMajor = introParts[0] || 0
          const introMinor = introParts[1] || 0
          const introPatch = introParts[2] || 0

          // 如果当前版本小于引入版本，不包含此配置项
          if (
            major < introMajor ||
            (major === introMajor && minor < introMinor) ||
            (major === introMajor && minor === introMinor && patch < introPatch)
          ) {
            return false
          }
        }

        // 如果配置项已废弃，检查版本是否已废弃
        if (option.deprecatedIn) {
          const deprecParts = option.deprecatedIn.split('.').map(Number)
          const deprecMajor = deprecParts[0] || 0
          const deprecMinor = deprecParts[1] || 0
          const deprecPatch = deprecParts[2] || 0

          // 如果当前版本大于等于废弃版本，不包含此配置项
          if (
            major > deprecMajor ||
            (major === deprecMajor && minor > deprecMinor) ||
            (major === deprecMajor && minor === deprecMinor && patch >= deprecPatch)
          ) {
            return false
          }
        }

        return true
      })
    }

    // 按分类分组
    const grouped: Record<string, ConfigOptionSchema[]> = {}
    
    for (const option of filteredSchema) {
      const category = option.category || 'other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(option)
    }

    // 转换为带标签的对象
    const result: Record<string, { label: string; options: ConfigOptionSchema[] }> = {}
    
    for (const [category, options] of Object.entries(grouped)) {
      result[category] = {
        label: CATEGORY_LABELS[category] || category,
        options,
      }
    }

    return result
  }

  /**
   * 获取项目的 TypeScript 配置
   */
  async getTypeScriptConfig(projectId: string): Promise<any> {
    const project = await this.projectService.findOne(projectId)
    const projectPath = resolve(project.path)
    const tsconfigPath = join(projectPath, 'tsconfig.json')

    try {
      // 检查文件是否存在
      await fs.access(tsconfigPath)
      
      // 读取文件内容
      const content = await fs.readFile(tsconfigPath, 'utf-8')
      
      // 解析 JSON（支持注释）
      const config = this.parseJsonWithComments(content)
      
      return {
        success: true,
        data: {
          config,
          path: tsconfigPath,
        },
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // 文件不存在，返回默认配置
        return {
          success: true,
          data: {
            config: this.getDefaultConfig(),
            path: tsconfigPath,
            isNew: true,
          },
        }
      }
      
      this.logger.error(`Failed to read tsconfig.json: ${error.message}`)
      throw new BadRequestException(`读取 tsconfig.json 失败: ${error.message}`)
    }
  }

  /**
   * 更新项目的 TypeScript 配置
   */
  async updateTypeScriptConfig(dto: UpdateTypeScriptConfigDto): Promise<any> {
    const project = await this.projectService.findOne(dto.projectId)
    const projectPath = resolve(project.path)
    const tsconfigPath = join(projectPath, 'tsconfig.json')

    try {
      // 验证配置格式
      this.validateConfig(dto.config)

      // 深度合并配置：确保 compilerOptions 等嵌套对象正确合并
      let finalConfig = await this.deepMergeConfig(dto)

      // 格式化并写入文件
      const formattedContent = JSON.stringify(finalConfig, null, 2)
      await fs.writeFile(tsconfigPath, formattedContent, 'utf-8')

      this.logger.log(`Updated tsconfig.json for project ${dto.projectId} at ${tsconfigPath}`)

      return {
        success: true,
        message: 'TypeScript 配置更新成功',
        data: {
          config: finalConfig,
          path: tsconfigPath,
        },
      }
    } catch (error: any) {
      this.logger.error(`Failed to update tsconfig.json: ${error.message}`, error.stack)
      throw new BadRequestException(`更新 tsconfig.json 失败: ${error.message}`)
    }
  }

  /**
   * 深度合并配置，确保嵌套对象正确合并
   */
  private async deepMergeConfig(dto: UpdateTypeScriptConfigDto): Promise<Record<string, any>> {
    const project = await this.projectService.findOne(dto.projectId)
    const projectPath = resolve(project.path)
    const tsconfigPath = join(projectPath, 'tsconfig.json')
    
    // 尝试读取现有配置
    let existingConfig: Record<string, any> = {}
    try {
      const content = await fs.readFile(tsconfigPath, 'utf-8')
      existingConfig = this.parseJsonWithComments(content)
    } catch {
      // 文件不存在，使用默认配置
      existingConfig = this.getDefaultConfig()
    }

    // 深度合并
    return this.deepMerge(existingConfig, dto.config)
  }

  /**
   * 深度合并两个对象
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target }
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key]) && this.isObject(target[key])) {
          // 递归合并嵌套对象
          output[key] = this.deepMerge(target[key], source[key])
        } else {
          // 直接覆盖
          output[key] = source[key]
        }
      })
    }
    
    return output
  }

  /**
   * 检查是否为对象
   */
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item)
  }

  /**
   * 更新项目的 TypeScript 版本
   */
  async updateTypeScriptVersion(dto: UpdateTypeScriptVersionDto): Promise<any> {
    const project = await this.projectService.findOne(dto.projectId)
    const projectPath = resolve(project.path)
    const packageJsonPath = join(projectPath, 'package.json')

    // 验证版本号格式
    if (!/^\d+\.\d+\.\d+/.test(dto.version)) {
      throw new BadRequestException('无效的版本号格式')
    }

    try {
      // 读取 package.json
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(packageJsonContent)

      // 更新 TypeScript 版本
      if (!packageJson.devDependencies) {
        packageJson.devDependencies = {}
      }

      const oldVersion = packageJson.devDependencies.typescript || packageJson.dependencies?.typescript || 'none'
      packageJson.devDependencies.typescript = `^${dto.version}`

      // 如果 typescript 在 dependencies 中，也更新
      if (packageJson.dependencies?.typescript) {
        packageJson.dependencies.typescript = `^${dto.version}`
      }

      // 写入 package.json
      await fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2),
        'utf-8',
      )

      this.logger.log(
        `Updated TypeScript version for project ${dto.projectId}: ${oldVersion} -> ^${dto.version}`,
      )

      return {
        success: true,
        message: 'TypeScript 版本更新成功',
        data: {
          oldVersion,
          newVersion: `^${dto.version}`,
          packageJson,
        },
      }
    } catch (error: any) {
      this.logger.error(`Failed to update TypeScript version: ${error.message}`)
      throw new BadRequestException(`更新 TypeScript 版本失败: ${error.message}`)
    }
  }

  /**
   * 获取项目的当前 TypeScript 版本
   */
  async getCurrentTypeScriptVersion(projectId: string): Promise<any> {
    const project = await this.projectService.findOne(projectId)
    const projectPath = resolve(project.path)
    const packageJsonPath = join(projectPath, 'package.json')

    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(packageJsonContent)

      const version =
        packageJson.devDependencies?.typescript ||
        packageJson.dependencies?.typescript ||
        null

      if (!version) {
        return {
          success: true,
          data: {
            version: null,
            message: '项目中未找到 TypeScript 依赖',
          },
        }
      }

      // 提取版本号（去除 ^, ~, >= 等前缀）
      const cleanVersion = version.replace(/^[\^~>=<]+/, '').trim()
      const parts = cleanVersion.split('.')
      const versionNumber = `${parts[0] || '0'}.${parts[1] || '0'}.${parts[2] || '0'}`

      return {
        success: true,
        data: {
          version: versionNumber,
          rawVersion: version,
        },
      }
    } catch (error: any) {
      this.logger.error(`Failed to get TypeScript version: ${error.message}`)
      throw new BadRequestException(`获取 TypeScript 版本失败: ${error.message}`)
    }
  }

  /**
   * 解析带注释的 JSON（简单的处理，移除注释）
   */
  private parseJsonWithComments(content: string): any {
    // 移除单行注释
    let cleaned = content.replace(/\/\/.*$/gm, '')
    // 移除多行注释
    cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '')
    return JSON.parse(cleaned)
  }

  /**
   * 验证配置格式
   */
  private validateConfig(config: any): void {
    if (!config || typeof config !== 'object') {
      throw new BadRequestException('配置必须是对象')
    }
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): any {
    return {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        allowJs: true,
        strict: false,
        noImplicitAny: false,
        strictNullChecks: false,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ['src'],
      exclude: ['node_modules'],
    }
  }
}

