import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { promises as fs } from 'fs'
import { join, resolve } from 'path'
import {
  GetPackageConfigDto,
  UpdatePackageConfigDto,
} from './dto/package-config.dto.js'
import { PACKAGE_CONFIG_SCHEMA, PackageConfigOptionSchema, PACKAGE_CATEGORY_LABELS } from './package-config-schema.js'
import { VersionBumpOption } from './entities/version-bump-option.entity.js'
import { BuilderOutputDir } from './entities/builder-output-dir.entity.js'
import { Project } from '../project/entities/project.entity.js'

/**
 * Package 配置服务
 */
@Injectable()
export class PackageService implements OnModuleInit {
  private readonly logger = new Logger(PackageService.name)

  constructor(
    @InjectRepository(VersionBumpOption)
    private readonly versionBumpOptionRepository: Repository<VersionBumpOption>,
    @InjectRepository(BuilderOutputDir)
    private readonly builderOutputDirRepository: Repository<BuilderOutputDir>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * 模块初始化时，确保默认版本提升选项存在
   */
  async onModuleInit() {
    await Promise.all([
      this.initializeVersionBumpOptions(),
      this.initializeBuilderOutputDirs(),
    ])
  }

  /**
   * 初始化默认版本提升选项
   */
  private async initializeVersionBumpOptions() {
    const defaultOptions: Omit<VersionBumpOption, 'createdAt' | 'updatedAt'>[] = [
      {
        type: 'none',
        label: '不升级',
        icon: 'Circle',
        example: '',
        description: '保持当前版本不变。适用于调试构建、预览构建或不需要发布的构建。',
        enabled: true,
        order: 0,
      },
      {
        type: 'patch',
        label: '补丁版本',
        icon: 'Wrench',
        example: '0.0.x',
        description: '修复 bug 或小改动。适用于修复错误、文档更新、代码优化、依赖升级（无功能变化）。示例：1.2.3 → 1.2.4',
        enabled: true,
        order: 1,
      },
      {
        type: 'minor',
        label: '次要版本',
        icon: 'Sparkles',
        example: '0.x.0',
        description: '新增功能但向后兼容。适用于新增功能、API 扩展、向后兼容的改动、性能提升。示例：1.2.3 → 1.3.0',
        enabled: true,
        order: 2,
      },
      {
        type: 'major',
        label: '主要版本',
        icon: 'Rocket',
        example: 'x.0.0',
        description: '重大更新或不兼容改动。适用于破坏性更新、重大架构调整、不兼容的 API 改动、完全重写。示例：1.2.3 → 2.0.0',
        enabled: true,
        order: 3,
      },
      {
        type: 'alpha',
        label: 'Alpha 版本',
        icon: 'FlaskConical',
        example: '.alpha-x',
        description: 'Alpha 预发布版本。适用于早期测试版本，功能可能不稳定。示例：1.2.3 → 1.2.3-alpha.1',
        enabled: true,
        order: 4,
      },
      {
        type: 'beta',
        label: 'Beta 版本',
        icon: 'Microscope',
        example: '.beta-x',
        description: 'Beta 预发布版本。适用于功能基本完成但需要更多测试的版本。示例：1.2.3 → 1.2.3-beta.1',
        enabled: true,
        order: 5,
      },
      {
        type: 'rc',
        label: 'RC 版本',
        icon: 'Target',
        example: '.rc-x',
        description: 'Release Candidate 版本。适用于接近正式发布的候选版本，功能已稳定。示例：1.2.3 → 1.2.3-rc.1',
        enabled: true,
        order: 6,
      },
    ]

    for (const option of defaultOptions) {
      const existing = await this.versionBumpOptionRepository.findOne({
        where: { type: option.type },
      })

      if (!existing) {
        const newOption = this.versionBumpOptionRepository.create({
          ...option,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        await this.versionBumpOptionRepository.save(newOption)
        this.logger.log(`Initialized version bump option: ${option.type}`)
      }
    }
  }

  /**
   * 获取 Package.json 配置 Schema（按分类分组）
   */
  async getConfigSchema(): Promise<Record<string, { label: string; options: PackageConfigOptionSchema[] }>> {
    const grouped: Record<string, PackageConfigOptionSchema[]> = {}
    
    for (const option of PACKAGE_CONFIG_SCHEMA) {
      const category = option.category || 'other'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(option)
    }

    const result: Record<string, { label: string; options: PackageConfigOptionSchema[] }> = {}
    for (const [category, options] of Object.entries(grouped)) {
      result[category] = {
        label: PACKAGE_CATEGORY_LABELS[category] || category,
        options,
      }
    }
    
    return result
  }

  /**
   * 获取项目的 package.json
   */
  async getPackageConfig(dto: GetPackageConfigDto): Promise<Record<string, any>> {
    try {
      const project = await this.projectRepository.findOne({ where: { id: dto.projectId } })
      if (!project) {
        throw new NotFoundException(`项目 ${dto.projectId} 不存在`)
      }
      const projectPath = resolve(project.path)
      const packageJsonPath = join(projectPath, 'package.json')

      // 检查文件是否存在
      try {
        await fs.access(packageJsonPath)
      } catch {
        throw new NotFoundException('package.json 文件不存在')
      }

      // 读取文件内容
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)

      this.logger.log(`Read package.json for project ${dto.projectId}`)

      return {
        success: true,
        data: {
          config: packageJson,
          path: packageJsonPath,
        },
      }
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error
      }
      this.logger.error(`Failed to read package.json: ${error.message}`, error.stack)
      throw new BadRequestException(`读取 package.json 失败: ${error.message}`)
    }
  }

  /**
   * 更新项目的 package.json
   */
  async updatePackageConfig(dto: UpdatePackageConfigDto): Promise<Record<string, any>> {
    try {
      const project = await this.projectRepository.findOne({ where: { id: dto.projectId } })
      if (!project) {
        throw new NotFoundException(`项目 ${dto.projectId} 不存在`)
      }
      const projectPath = resolve(project.path)
      const packageJsonPath = join(projectPath, 'package.json')

      // 深度合并配置
      const finalConfig = await this.deepMergeConfig(dto)

      // 验证配置
      this.validateConfig(finalConfig)

      // 写入文件
      const formattedContent = JSON.stringify(finalConfig, null, 2)
      await fs.writeFile(packageJsonPath, formattedContent, 'utf-8')

      this.logger.log(`Updated package.json for project ${dto.projectId} at ${packageJsonPath}`)

      return {
        success: true,
        message: 'Package.json 配置更新成功',
        data: {
          config: finalConfig,
          path: packageJsonPath,
        },
      }
    } catch (error: any) {
      this.logger.error(`Failed to update package.json: ${error.message}`, error.stack)
      throw new BadRequestException(`更新 package.json 失败: ${error.message}`)
    }
  }

  /**
   * 深度合并配置，确保嵌套对象正确合并
   */
  private async deepMergeConfig(dto: UpdatePackageConfigDto): Promise<Record<string, any>> {
    const project = await this.projectRepository.findOne({ where: { id: dto.projectId } })
    if (!project) {
      throw new NotFoundException(`项目 ${dto.projectId} 不存在`)
    }
    const projectPath = resolve(project.path)
    const packageJsonPath = join(projectPath, 'package.json')
    
    // 尝试读取现有配置
    let existingConfig: Record<string, any> = {}
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      existingConfig = JSON.parse(content)
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
        } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
          // 数组合并策略：对于依赖对象，合并键值；对于普通数组，替换
          if (this.isDependencyObject(key)) {
            output[key] = { ...target[key], ...source[key] }
          } else {
            output[key] = source[key]
          }
        } else {
          // 其他情况直接替换
          output[key] = source[key]
        }
      })
    }
    
    return output
  }

  /**
   * 判断是否为依赖对象（dependencies、devDependencies 等）
   */
  private isDependencyObject(key: string): boolean {
    return ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'].includes(key)
  }

  /**
   * 判断是否为对象
   */
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item)
  }

  /**
   * 验证配置
   */
  private validateConfig(config: Record<string, any>): void {
    // 必需字段验证
    if (!config.name || typeof config.name !== 'string') {
      throw new BadRequestException('package.json 必须包含 name 字段')
    }
    
    if (!config.version || typeof config.version !== 'string') {
      throw new BadRequestException('package.json 必须包含 version 字段')
    }

    // 名称格式验证
    const nameRegex = /^[a-z0-9._-]+$/
    if (!nameRegex.test(config.name)) {
      throw new BadRequestException('package.json 的 name 字段格式不正确')
    }

    // 版本格式验证（简单的 semver 验证）
    const versionRegex = /^\d+\.\d+\.\d+(-.+)?$/
    if (!versionRegex.test(config.version)) {
      throw new BadRequestException('package.json 的 version 字段格式不正确，应遵循语义化版本规范')
    }
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): Record<string, any> {
    return {
      name: 'my-package',
      version: '1.0.0',
      description: '',
      main: 'index.js',
      scripts: {},
      keywords: [],
      author: '',
      license: 'MIT',
    }
  }

  /**
   * 获取项目的当前版本号
   */
  async getCurrentVersion(projectId: string): Promise<{ version: string; name: string }> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } })
    if (!project) {
      throw new NotFoundException(`项目 ${projectId} 不存在`)
    }
    const projectPath = resolve(project.path)
    const packageJsonPath = join(projectPath, 'package.json')

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)
      return {
        version: packageJson.version || '0.0.0',
        name: packageJson.name || project.name,
      }
    } catch (error: any) {
      this.logger.error(`Failed to read package.json: ${error.message}`)
      throw new BadRequestException(`读取版本号失败: ${error.message}`)
    }
  }

  /**
   * 更新项目版本号
   */
  async updateVersion(projectId: string, newVersion: string): Promise<{ oldVersion: string; newVersion: string }> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } })
    if (!project) {
      throw new NotFoundException(`项目 ${projectId} 不存在`)
    }
    const projectPath = resolve(project.path)
    const packageJsonPath = join(projectPath, 'package.json')

    // 验证版本号格式
    const versionRegex = /^\d+\.\d+\.\d+(-.+)?$/
    if (!versionRegex.test(newVersion)) {
      throw new BadRequestException('版本号格式不正确，应遵循语义化版本规范 (x.y.z 或 x.y.z-prerelease)')
    }

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(content)
      const oldVersion = packageJson.version || '0.0.0'
      
      packageJson.version = newVersion
      
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8')
      
      this.logger.log(`Updated version for project ${projectId}: ${oldVersion} -> ${newVersion}`)
      
      return {
        oldVersion,
        newVersion,
      }
    } catch (error: any) {
      this.logger.error(`Failed to update version: ${error.message}`)
      throw new BadRequestException(`更新版本号失败: ${error.message}`)
    }
  }

  /**
   * 获取所有版本提升选项
   */
  async getVersionBumpOptions(): Promise<VersionBumpOption[]> {
    return this.versionBumpOptionRepository.find({
      where: { enabled: true },
      order: { order: 'ASC' },
    })
  }

  /**
   * 初始化默认 Builder 输出目录
   */
  private async initializeBuilderOutputDirs() {
    const defaultDirs: Omit<BuilderOutputDir, 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'es',
        label: 'ESM 格式',
        description: 'ES Module 格式输出目录，保留模块结构，生成类型声明',
        enabled: true,
        order: 0,
      },
      {
        name: 'lib',
        label: 'CJS 格式',
        description: 'CommonJS 格式输出目录，保留模块结构，生成类型声明',
        enabled: true,
        order: 1,
      },
      {
        name: 'dist',
        label: 'UMD 格式',
        description: 'UMD 格式输出目录，单文件打包，用于浏览器直接引用',
        enabled: true,
        order: 2,
      },
    ]

    for (const dir of defaultDirs) {
      const existing = await this.builderOutputDirRepository.findOne({
        where: { name: dir.name },
      })

      if (!existing) {
        const newDir = this.builderOutputDirRepository.create({
          ...dir,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
        await this.builderOutputDirRepository.save(newDir)
        this.logger.log(`Initialized builder output dir: ${dir.name}`)
      }
    }
  }

  /**
   * 获取所有 Builder 输出目录配置
   */
  async getBuilderOutputDirs(): Promise<BuilderOutputDir[]> {
    return this.builderOutputDirRepository.find({
      order: { order: 'ASC' },
    })
  }

  /**
   * 获取启用的 Builder 输出目录名称列表
   */
  async getEnabledBuilderOutputDirNames(): Promise<string[]> {
    const dirs = await this.builderOutputDirRepository.find({
      where: { enabled: true },
      order: { order: 'ASC' },
    })
    return dirs.map(dir => dir.name)
  }

  /**
   * 更新 Builder 输出目录配置
   */
  async updateBuilderOutputDirs(dirs: Array<{
    name: string
    label?: string
    description?: string
    enabled?: boolean
    order?: number
  }>): Promise<BuilderOutputDir[]> {
    const updatedDirs: BuilderOutputDir[] = []

    for (const dirData of dirs) {
      let dir = await this.builderOutputDirRepository.findOne({
        where: { name: dirData.name },
      })

      if (dir) {
        // 更新现有目录
        if (dirData.label !== undefined) dir.label = dirData.label
        if (dirData.description !== undefined) dir.description = dirData.description
        if (dirData.enabled !== undefined) dir.enabled = dirData.enabled
        if (dirData.order !== undefined) dir.order = dirData.order
        dir.updatedAt = Date.now()
      } else {
        // 创建新目录
        dir = this.builderOutputDirRepository.create({
          name: dirData.name,
          label: dirData.label || dirData.name,
          description: dirData.description,
          enabled: dirData.enabled !== undefined ? dirData.enabled : true,
          order: dirData.order !== undefined ? dirData.order : 999,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        })
      }

      const saved = await this.builderOutputDirRepository.save(dir)
      updatedDirs.push(saved)
    }

    return updatedDirs
  }
}










