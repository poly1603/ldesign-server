import { Injectable, NotFoundException, ConflictException, Logger, Inject } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project, ProjectCategory, ProjectType } from './entities/project.entity.js'
import { CommandExecution } from './entities/command-execution.entity.js'
import { CreateProjectDto } from './dto/create-project.dto.js'
import { UpdateProjectDto } from './dto/update-project.dto.js'
import { ImportProjectDto } from './dto/import-project.dto.js'
import { PathUtil } from '../../utils/path.util.js'
import { randomUUID } from 'crypto'
import { basename } from 'path'
import { BuilderOutputDir } from '../package/entities/builder-output-dir.entity.js'

/**
 * 项目管理服务
 */
@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name)

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(CommandExecution)
    private commandExecutionRepository: Repository<CommandExecution>,
    @InjectRepository(BuilderOutputDir)
    private readonly builderOutputDirRepository: Repository<BuilderOutputDir>,
  ) {}

  /**
   * 获取所有项目（支持查询、排序、分类）
   * @param options - 查询选项
   * @returns 项目列表
   */
  async findAll(options?: {
    search?: string
    category?: ProjectCategory
    type?: ProjectType
    framework?: string
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastOpenedAt'
    sortOrder?: 'ASC' | 'DESC'
  }): Promise<Project[]> {
    const queryBuilder = this.projectRepository.createQueryBuilder('project')

    // 搜索条件
    if (options?.search) {
      queryBuilder.where(
        '(project.name LIKE :search OR project.description LIKE :search OR project.path LIKE :search)',
        { search: `%${options.search}%` },
      )
    }

    // 分类过滤
    if (options?.category) {
      if (options.search) {
        queryBuilder.andWhere('project.category = :category', { category: options.category })
      } else {
        queryBuilder.where('project.category = :category', { category: options.category })
      }
    }

    // 类型过滤
    if (options?.type) {
      if (options.search || options.category) {
        queryBuilder.andWhere('project.type = :type', { type: options.type })
      } else {
        queryBuilder.where('project.type = :type', { type: options.type })
      }
    }

    // 框架过滤
    if (options?.framework) {
      if (options.search || options.category || options.type) {
        queryBuilder.andWhere('project.framework = :framework', { framework: options.framework })
      } else {
        queryBuilder.where('project.framework = :framework', { framework: options.framework })
      }
    }

    // 排序
    const sortBy = options?.sortBy || 'lastOpenedAt'
    const sortOrder = options?.sortOrder || 'DESC'
    queryBuilder.orderBy(`project.${sortBy}`, sortOrder)

    // 如果按 lastOpenedAt 排序，添加 createdAt 作为二级排序
    if (sortBy === 'lastOpenedAt') {
      queryBuilder.addOrderBy('project.createdAt', 'DESC')
    }

    return queryBuilder.getMany()
  }

  /**
   * 根据 ID 获取项目
   * @param id - 项目 ID
   * @returns 项目信息
   */
  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id } })
    if (!project) {
      throw new NotFoundException(`项目 ${id} 不存在`)
    }
    return project
  }

  /**
   * 创建新项目
   * @param createProjectDto - 创建项目 DTO
   * @returns 创建的项目
   */
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // 验证路径
    const normalizedPath = PathUtil.normalize(createProjectDto.path)
    const validation = PathUtil.validate(normalizedPath, {
      mustExist: true,
      mustBeDirectory: true,
      mustBeReadable: true,
    })

    if (!validation.valid) {
      throw new ConflictException(`路径验证失败: ${validation.errors.join(', ')}`)
    }

    // 检查路径是否已存在
    const existing = await this.projectRepository.findOne({
      where: { path: normalizedPath },
    })
    if (existing) {
      throw new ConflictException(`路径 ${normalizedPath} 已被项目 ${existing.name} 使用`)
    }

    // 如果提供了路径但没有提供详细信息，尝试分析项目
    let analysis: {
      category?: ProjectCategory
      framework?: string
      frameworkVersion?: string
      isTypeScript: boolean
      packageManager?: string
      description?: string
    } | null = null

    if (!createProjectDto.framework && !createProjectDto.packageManager) {
      analysis = await this.detectProjectInfo(normalizedPath)
    }

    // 创建项目
    const project = this.projectRepository.create({
      id: randomUUID(),
      name: createProjectDto.name,
      path: normalizedPath,
      type: createProjectDto.type,
      category: analysis?.category,
      framework: createProjectDto.framework || analysis?.framework,
      frameworkVersion: analysis?.frameworkVersion,
      isTypeScript: analysis?.isTypeScript ?? false,
      packageManager: createProjectDto.packageManager || analysis?.packageManager,
      description: createProjectDto.description || analysis?.description,
      config: createProjectDto.config ? JSON.stringify(createProjectDto.config) : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return this.projectRepository.save(project)
  }

  /**
   * 导入项目
   * @param importProjectDto - 导入项目 DTO
   * @returns 导入的项目
   */
  async import(importProjectDto: ImportProjectDto): Promise<Project> {
    // 验证路径
    const normalizedPath = PathUtil.normalize(importProjectDto.path)
    const validation = PathUtil.validate(normalizedPath, {
      mustExist: true,
      mustBeDirectory: true,
      mustBeReadable: true,
    })

    if (!validation.valid) {
      throw new ConflictException(`路径验证失败: ${validation.errors.join(', ')}`)
    }

    // 检查路径是否已存在
    const existing = await this.projectRepository.findOne({
      where: { path: normalizedPath },
    })
    if (existing) {
      // 更新最后打开时间
      existing.lastOpenedAt = Date.now()
      return this.projectRepository.save(existing)
    }

    // 从路径提取项目名称
    const projectName = importProjectDto.name || basename(normalizedPath)

    // 分析项目详细信息
    const analysis = await this.analyzeProject(normalizedPath)

    // 创建项目
    const project = this.projectRepository.create({
      id: randomUUID(),
      name: importProjectDto.name || analysis.name,
      path: normalizedPath,
      type: analysis.type,
      category: analysis.category,
      framework: analysis.framework,
      frameworkVersion: analysis.frameworkVersion,
      isTypeScript: analysis.isTypeScript,
      packageManager: analysis.packageManager,
      description: analysis.description,
      config: analysis.config ? JSON.stringify(analysis.config) : undefined,
      lastOpenedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return this.projectRepository.save(project)
  }

  /**
   * 更新项目
   * @param id - 项目 ID
   * @param updateProjectDto - 更新项目 DTO
   * @returns 更新后的项目
   */
  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id)

    // 如果更新路径，需要验证
    if (updateProjectDto.path) {
      const normalizedPath = PathUtil.normalize(updateProjectDto.path)
      const validation = PathUtil.validate(normalizedPath, {
        mustExist: true,
        mustBeDirectory: true,
        mustBeReadable: true,
      })

      if (!validation.valid) {
        throw new ConflictException(`路径验证失败: ${validation.errors.join(', ')}`)
      }

      // 检查路径是否被其他项目使用
      const existing = await this.projectRepository.findOne({
        where: { path: normalizedPath },
      })
      if (existing && existing.id !== id) {
        throw new ConflictException(`路径 ${normalizedPath} 已被项目 ${existing.name} 使用`)
      }

      project.path = normalizedPath
    }

    // 更新其他字段
    if (updateProjectDto.name !== undefined) {
      project.name = updateProjectDto.name
    }
    if (updateProjectDto.type !== undefined) {
      project.type = updateProjectDto.type
    }
    if (updateProjectDto.framework !== undefined) {
      project.framework = updateProjectDto.framework
    }
    if (updateProjectDto.packageManager !== undefined) {
      project.packageManager = updateProjectDto.packageManager
    }
    if (updateProjectDto.description !== undefined) {
      project.description = updateProjectDto.description
    }
    if (updateProjectDto.config !== undefined) {
      project.config = JSON.stringify(updateProjectDto.config)
    }
    
    // 如果需要重新分析项目（当路径改变时）
    if (updateProjectDto.path && updateProjectDto.path !== project.path) {
      const analysis = await this.analyzeProject(PathUtil.normalize(updateProjectDto.path))
      project.category = analysis.category
      project.framework = analysis.framework
      project.frameworkVersion = analysis.frameworkVersion
      project.isTypeScript = analysis.isTypeScript
      project.packageManager = analysis.packageManager
      if (analysis.description && !project.description) {
        project.description = analysis.description
      }
    }

    project.updatedAt = Date.now()

    return this.projectRepository.save(project)
  }

  /**
   * 删除项目
   * @param id - 项目 ID
   */
  async remove(id: string): Promise<void> {
    const project = await this.findOne(id)
    await this.projectRepository.remove(project)
  }

  /**
   * 更新项目最后打开时间
   * @param id - 项目 ID
   */
  async updateLastOpenedAt(id: string): Promise<void> {
    const project = await this.findOne(id)
    project.lastOpenedAt = Date.now()
    await this.projectRepository.save(project)
  }

  /**
   * 在系统文件管理器中打开项目文件夹
   * @param id - 项目 ID
   */
  async openFolder(id: string): Promise<void> {
    const project = await this.findOne(id)
    const projectPath = project.path

    const currentPlatform = process.platform

    try {
      if (currentPlatform === 'win32') {
        // Windows: 使用 spawn 执行 explorer 命令
        // explorer 命令即使成功打开文件夹，也可能返回非零退出码
        // 使用 spawn 并设置 detached: true，不等待进程退出
        const { spawn } = await import('child_process')
        const child = spawn('explorer', [projectPath], {
          detached: true,
          stdio: 'ignore',
        })
        // 立即解除对子进程的引用，允许父进程独立继续
        child.unref()
        this.logger.log(`已打开项目文件夹: ${projectPath}`)
      } else if (currentPlatform === 'darwin') {
        // macOS: 使用 open 命令
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execAsync = promisify(exec)
        await execAsync(`open "${projectPath}"`)
        this.logger.log(`已打开项目文件夹: ${projectPath}`)
      } else {
        // Linux: 使用 xdg-open 命令
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execAsync = promisify(exec)
        await execAsync(`xdg-open "${projectPath}"`)
        this.logger.log(`已打开项目文件夹: ${projectPath}`)
      }
    } catch (error: any) {
      // 记录错误但不抛出，因为文件夹可能已经打开了
      // 特别是在 Windows 上，explorer 命令即使成功也可能报错
      this.logger.warn(`打开文件夹时出现警告: ${error.message}，但文件夹可能已成功打开`)
      // 不抛出错误，让接口正常返回成功
    }
  }

  /**
   * 分析项目详细信息
   * @param path - 项目路径
   * @returns 分析结果
   */
  async analyzeProject(path: string): Promise<{
    name: string
    type: Project['type']
    category?: ProjectCategory
    framework?: string
    frameworkVersion?: string
    isTypeScript: boolean
    packageManager?: string
    description?: string
    hasLauncher: boolean
    hasBuilder: boolean
    config?: any
  }> {
    const normalizedPath = PathUtil.normalize(path)
    const fsModule = await import('fs-extra')
    const fs = fsModule.default ?? fsModule
    const pathModule = await import('path')
    const pathUtils = pathModule.default ?? pathModule
    const { basename, join } = pathUtils
    const packageJsonPath = join(normalizedPath, 'package.json')

    const result: {
      name: string
      type: Project['type']
      category?: ProjectCategory
      framework?: string
      frameworkVersion?: string
      isTypeScript: boolean
      packageManager?: string
      description?: string
      hasLauncher: boolean
      hasBuilder: boolean
      config?: any
    } = {
      name: basename(normalizedPath),
      type: 'other',
      isTypeScript: false,
      hasLauncher: false,
      hasBuilder: false,
    }

    // 检查 package.json
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = await fs.readJson(packageJsonPath)

        // 项目名称
        if (packageJson.name) {
          result.name = packageJson.name
        }

        // 项目描述
        if (packageJson.description) {
          result.description = packageJson.description
        }

        // 检测包管理器
        if (await fs.pathExists(join(normalizedPath, 'pnpm-lock.yaml'))) {
          result.packageManager = 'pnpm'
        } else if (await fs.pathExists(join(normalizedPath, 'yarn.lock'))) {
          result.packageManager = 'yarn'
        } else if (await fs.pathExists(join(normalizedPath, 'package-lock.json'))) {
          result.packageManager = 'npm'
        }

        // 检测 LDesign 工具
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        }

        result.hasLauncher = !!(deps['@ldesign/launcher'] || deps['ldesign-launcher'])
        result.hasBuilder = !!(deps['@ldesign/builder'] || deps['ldesign-builder'])

        // 确定项目类别
        if (result.hasLauncher && result.hasBuilder) {
          result.category = 'project-library'
        } else if (result.hasLauncher) {
          result.category = 'project'
        } else if (result.hasBuilder) {
          result.category = 'library'
        } else {
          result.category = 'other'
        }

        // 检测 TypeScript
        result.isTypeScript = !!(
          await fs.pathExists(join(normalizedPath, 'tsconfig.json')) ||
          await fs.pathExists(join(normalizedPath, 'tsconfig.app.json')) ||
          await fs.pathExists(join(normalizedPath, 'tsconfig.node.json')) ||
          deps.typescript ||
          deps['@types/node']
        )

        // 检测框架
        if (deps.vue) {
          result.framework = 'vue'
          // 检测 Vue 版本
          const vueVersion = deps.vue
          if (vueVersion.startsWith('^3') || vueVersion.startsWith('~3') || vueVersion.startsWith('3.')) {
            result.frameworkVersion = '3.x'
            result.framework = 'vue3'
          } else if (vueVersion.startsWith('^2') || vueVersion.startsWith('~2') || vueVersion.startsWith('2.')) {
            result.frameworkVersion = '2.x'
            result.framework = 'vue2'
          }
          result.type = 'web'
        } else if (deps['@vue/cli-service']) {
          result.framework = 'vue2'
          result.frameworkVersion = '2.x'
          result.type = 'web'
        } else if (deps['@vitejs/plugin-vue']) {
          result.framework = 'vue3'
          result.frameworkVersion = '3.x'
          result.type = 'web'
        } else if (deps.react || deps['react-dom']) {
          result.framework = 'react'
          // 检测 React 版本
          const reactVersion = deps.react || deps['react-dom']
          if (reactVersion.startsWith('^18') || reactVersion.startsWith('~18') || reactVersion.startsWith('18.')) {
            result.frameworkVersion = '18.x'
          } else if (reactVersion.startsWith('^17') || reactVersion.startsWith('~17') || reactVersion.startsWith('17.')) {
            result.frameworkVersion = '17.x'
          }
          result.type = 'web'
        } else if (deps['@angular/core']) {
          result.framework = 'angular'
          result.type = 'web'
        } else if (deps.next) {
          result.framework = 'next'
          result.type = 'web'
        } else if (deps.nuxt || deps['nuxt3']) {
          result.framework = deps.nuxt3 ? 'nuxt3' : 'nuxt'
          result.type = 'web'
        } else if (deps.express || deps['@nestjs/core']) {
          result.framework = deps['@nestjs/core'] ? 'nestjs' : 'express'
          result.type = 'api'
        } else if (packageJson.name?.startsWith('@') || packageJson.main || packageJson.module) {
          result.type = 'library'
        }

        // 读取配置信息
        if (result.hasLauncher) {
          const launcherConfigPath = join(normalizedPath, 'launcher.config.ts')
          const launcherConfigJsPath = join(normalizedPath, 'launcher.config.js')
          if (await fs.pathExists(launcherConfigPath) || await fs.pathExists(launcherConfigJsPath)) {
            // 可以尝试读取配置，但这里先不解析
            result.config = { hasLauncherConfig: true }
          }
        }

        if (result.hasBuilder) {
          const builderConfigPath = join(normalizedPath, 'builder.config.ts')
          const builderConfigJsPath = join(normalizedPath, 'builder.config.js')
          if (await fs.pathExists(builderConfigPath) || await fs.pathExists(builderConfigJsPath)) {
            result.config = {
              ...result.config,
              hasBuilderConfig: true,
            }
          }
        }
      } catch (error) {
        // 忽略解析错误，返回基本信息
      }
    }

    return result
  }

  /**
   * 检测项目信息（简化版，用于导入）
   * @param path - 项目路径
   * @returns 检测到的项目信息
   */
  private async detectProjectInfo(path: string): Promise<{
    type: Project['type']
    category?: ProjectCategory
    framework?: string
    frameworkVersion?: string
    isTypeScript: boolean
    packageManager?: string
  }> {
    const analysis = await this.analyzeProject(path)
    return {
      type: analysis.type,
      category: analysis.category,
      framework: analysis.framework,
      frameworkVersion: analysis.frameworkVersion,
      isTypeScript: analysis.isTypeScript,
      packageManager: analysis.packageManager,
    }
  }

  /**
   * 获取库项目的打包产物信息
   * @param id - 项目 ID
   * @returns 打包产物信息
   */
  async getLibraryBuildStatus(id: string): Promise<{
    built: boolean
    buildTime?: number
    buildDirs?: Array<{
      name: string
      path: string
      files?: Array<{
        name: string
        path: string
        size: number
        type: 'file' | 'directory'
        children?: Array<{
          name: string
          path: string
          size: number
          type: 'file' | 'directory'
          children?: any[]
        }>
      }>
      totalSize?: number
      fileCount?: number
    }>
    totalSize?: number
    totalFileCount?: number
  }> {
    const project = await this.findOne(id)
    const projectPath = project.path

    // 使用 fs-extra 处理文件系统操作
    const fsModule = await import('fs-extra')
    const pathModule = await import('path')
    const fs = fsModule.default || fsModule

    // 加载 builder 配置
    const builderConfigPath = pathModule.join(projectPath, '.ldesign', 'builder.config.ts')
    const builderConfigJsPath = pathModule.join(projectPath, '.ldesign', 'builder.config.js')
    
    let config: any = {}
    let configFile: string | null = null

    if (await fs.pathExists(builderConfigPath)) {
      configFile = builderConfigPath
    } else if (await fs.pathExists(builderConfigJsPath)) {
      configFile = builderConfigJsPath
    }

    // 根据 builder 配置确定输出目录
    const outputDirs: string[] = []
    
    if (configFile) {
      try {
        // 使用 jiti 加载 TypeScript 配置文件
        let configModule: any
        if (configFile.endsWith('.ts')) {
          try {
            const jitiMod: any = await import('jiti')
            const createJiti = (jitiMod && jitiMod.default) ? jitiMod.default : jitiMod
            const jitiLoader = createJiti(projectPath, {
              cache: true,
              requireCache: true,
              interopDefault: true,
              esmResolve: true,
            })
            configModule = jitiLoader(configFile)
          } catch (jitiError) {
            const { pathToFileURL } = await import('url')
            const configUrl = pathToFileURL(configFile).href
            configModule = await import(configUrl)
          }
        } else {
          const { pathToFileURL } = await import('url')
          const configUrl = pathToFileURL(configFile).href
          configModule = await import(configUrl)
        }
        
        config = configModule?.default || configModule

        // 从配置中提取输出目录
        // 支持多种配置格式
        if (config.output) {
          // 新格式：output: { esm: { dir: 'es' }, cjs: { dir: 'lib' }, umd: { dir: 'dist' } }
          if (config.output.esm) {
            const esmDir = typeof config.output.esm === 'object' && config.output.esm.dir
              ? config.output.esm.dir
              : 'es'
            if (config.output.esm !== false) {
              outputDirs.push(esmDir)
            }
          }
          if (config.output.cjs) {
            const cjsDir = typeof config.output.cjs === 'object' && config.output.cjs.dir
              ? config.output.cjs.dir
              : 'lib'
            if (config.output.cjs !== false) {
              outputDirs.push(cjsDir)
            }
          }
          if (config.output.umd) {
            const umdDir = typeof config.output.umd === 'object' && config.output.umd.dir
              ? config.output.umd.dir
              : 'dist'
            if (config.output.umd !== false) {
              outputDirs.push(umdDir)
            }
          }
          // 旧格式：output: { dir: 'dist' }
          if (config.output.dir && !outputDirs.includes(config.output.dir)) {
            outputDirs.push(config.output.dir)
          }
        }
      } catch (error) {
        // 配置加载失败，使用默认值
      }
    }

    // 如果没有配置，使用默认输出目录（从数据库获取）
    if (outputDirs.length === 0) {
      try {
        const defaultDirs = await this.builderOutputDirRepository.find({
          where: { enabled: true },
          order: { order: 'ASC' },
        })
        if (defaultDirs.length > 0) {
          outputDirs.push(...defaultDirs.map(dir => dir.name))
          this.logger.log(`[GetLibraryBuildStatus] 使用数据库中的默认输出目录: ${defaultDirs.map(d => d.name).join(', ')}`)
        } else {
          // 如果数据库中没有配置，使用硬编码的默认值（向后兼容）
          outputDirs.push('dist', 'es', 'lib', 'cjs', 'umd')
          this.logger.warn(`[GetLibraryBuildStatus] 数据库中没有输出目录配置，使用硬编码默认值`)
        }
      } catch (error) {
        // 如果获取数据库配置失败，使用硬编码的默认值
        this.logger.warn(`[GetLibraryBuildStatus] 获取数据库配置失败，使用硬编码默认值: ${error}`)
        outputDirs.push('dist', 'es', 'lib', 'cjs', 'umd')
      }
    }

    // 去重
    const uniqueDirs = [...new Set(outputDirs)]

    /**
     * 递归遍历目录，构建文件树并统计
     */
    interface FileTreeNode {
      name: string
      path: string
      size: number
      type: 'file' | 'directory'
      children?: FileTreeNode[]
    }

    async function buildFileTree(dirPath: string, relativePath: string = ''): Promise<FileTreeNode | null> {
      try {
        const stats = await fs.stat(dirPath)
        
        if (stats.isFile()) {
          return {
            name: pathModule.basename(dirPath),
            path: relativePath || pathModule.basename(dirPath),
            size: stats.size,
            type: 'file',
          }
        } else if (stats.isDirectory()) {
          const children: FileTreeNode[] = []
          const entries = await fs.readdir(dirPath)
          
          for (const entry of entries) {
            const entryPath = pathModule.join(dirPath, entry)
            const entryRelativePath = relativePath ? pathModule.join(relativePath, entry) : entry
            const child = await buildFileTree(entryPath, entryRelativePath)
            if (child) {
              children.push(child)
            }
          }
          
          // 递归计算目录总大小
          function calculateDirSize(nodes: FileTreeNode[]): number {
            return nodes.reduce((sum, node) => {
              if (node.type === 'file') {
                return sum + node.size
              } else if (node.children) {
                return sum + calculateDirSize(node.children)
              }
              return sum
            }, 0)
          }
          
          const dirSize = calculateDirSize(children)
          
          return {
            name: pathModule.basename(dirPath),
            path: relativePath || pathModule.basename(dirPath),
            size: dirSize,
            type: 'directory',
            children: children.sort((a, b) => {
              if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1
              }
              return a.name.localeCompare(b.name)
            }),
          }
        }
      } catch (error) {
        return null
      }
      return null
    }

    /**
     * 递归统计文件数量
     */
    function countFiles(node: FileTreeNode): number {
      if (node.type === 'file') {
        return 1
      }
      if (node.children) {
        return node.children.reduce((count, child) => count + countFiles(child), 0)
      }
      return 0
    }

    /**
     * 递归计算总大小
     */
    function calculateTotalSize(node: FileTreeNode): number {
      if (node.type === 'file') {
        return node.size
      }
      if (node.children) {
        return node.children.reduce((sum, child) => sum + calculateTotalSize(child), 0)
      }
      return 0
    }

    // 检查所有输出目录
    const buildDirs: Array<{
      name: string
      path: string
      files?: FileTreeNode[]
      totalSize?: number
      fileCount?: number
    }> = []

    let totalSize = 0
    let totalFileCount = 0
    let latestBuildTime = 0

    this.logger.log(`[GetLibraryBuildStatus] 开始检查输出目录，项目路径: ${projectPath}`)
    this.logger.log(`[GetLibraryBuildStatus] 要检查的目录: ${uniqueDirs.join(', ')}`)

    for (const dir of uniqueDirs) {
      const buildDir = pathModule.isAbsolute(dir)
        ? dir
        : pathModule.join(projectPath, dir)

      this.logger.log(`[GetLibraryBuildStatus] 检查目录: ${buildDir}`)
      
      if (await fs.pathExists(buildDir)) {
        this.logger.log(`[GetLibraryBuildStatus] 目录存在: ${buildDir}`)
        const fileTree = await buildFileTree(buildDir, '')
        
        if (fileTree && fileTree.type === 'directory') {
          const fileCount = countFiles(fileTree)
          const dirSize = calculateTotalSize(fileTree)
          
          this.logger.log(`[GetLibraryBuildStatus] 目录 ${dir} 包含 ${fileCount} 个文件，总大小: ${dirSize} 字节`)
          
          // 获取目录修改时间
          const buildDirStats = await fs.stat(buildDir)
          const buildTime = buildDirStats.mtimeMs
          if (buildTime > latestBuildTime) {
            latestBuildTime = buildTime
          }

          buildDirs.push({
            name: dir,
            path: buildDir,
            files: fileTree.children || [],
            totalSize: dirSize,
            fileCount,
          })

          totalSize += dirSize
          totalFileCount += fileCount
        } else {
          this.logger.warn(`[GetLibraryBuildStatus] 目录 ${buildDir} 存在但不是有效目录或为空`)
        }
      } else {
        this.logger.log(`[GetLibraryBuildStatus] 目录不存在: ${buildDir}`)
      }
    }

    this.logger.log(`[GetLibraryBuildStatus] 找到 ${buildDirs.length} 个输出目录`)

    if (buildDirs.length === 0) {
      this.logger.warn(`[GetLibraryBuildStatus] 未找到任何输出目录，返回 built: false`)
      return {
        built: false,
      }
    }

    this.logger.log(`[GetLibraryBuildStatus] 库已打包，返回 built: true，总文件数: ${totalFileCount}，总大小: ${totalSize} 字节`)
    return {
      built: true,
      buildTime: latestBuildTime,
      buildDirs,
      totalSize,
      totalFileCount,
    }
  }

  /**
   * 检查项目的打包状态
   * @param id - 项目 ID
   * @param environment - 环境名称
   * @returns 打包状态信息
   */
  async getBuildStatus(id: string, environment: string = 'production'): Promise<{
    built: boolean
    buildTime?: number
    buildDir?: string
    files?: Array<{
      name: string
      path: string
      size: number
      type: 'file' | 'directory'
      children?: Array<{
        name: string
        path: string
        size: number
        type: 'file' | 'directory'
        children?: any[]
      }>
    }>
    totalSize?: number
    fileCount?: number
  }> {
    const project = await this.findOne(id)
    const projectPath = project.path

    // 使用 fs-extra 处理文件系统操作
    const fsModule = await import('fs-extra')
    const pathModule = await import('path')
    const fs = fsModule.default || fsModule

    // 加载 launcher 配置
    const configPath = pathModule.join(projectPath, '.ldesign', 'launcher.config.ts')
    const configJsPath = pathModule.join(projectPath, '.ldesign', 'launcher.config.js')
    
    let config: any = {}
    let configFile: string | null = null

    // 尝试加载环境特定配置
    const envConfigPath = pathModule.join(projectPath, '.ldesign', `launcher.config.${environment}.ts`)
    const envConfigJsPath = pathModule.join(projectPath, '.ldesign', `launcher.config.${environment}.js`)
    
    if (await fs.pathExists(envConfigPath)) {
      configFile = envConfigPath
    } else if (await fs.pathExists(envConfigJsPath)) {
      configFile = envConfigJsPath
    } else if (await fs.pathExists(configPath)) {
      configFile = configPath
    } else if (await fs.pathExists(configJsPath)) {
      configFile = configJsPath
    }

    if (configFile) {
      try {
        // 使用 jiti 加载 TypeScript 配置文件
        let configModule: any
        if (configFile.endsWith('.ts')) {
          try {
            const jitiMod: any = await import('jiti')
            const createJiti = (jitiMod && jitiMod.default) ? jitiMod.default : jitiMod
            const jitiLoader = createJiti(projectPath, {
              cache: true,
              requireCache: true,
              interopDefault: true,
              esmResolve: true,
            })
            configModule = jitiLoader(configFile)
          } catch (jitiError) {
            // jiti 加载失败，尝试使用动态导入
            const { pathToFileURL } = await import('url')
            const configUrl = pathToFileURL(configFile).href
            configModule = await import(configUrl)
          }
        } else {
          // JavaScript 文件直接导入
          const { pathToFileURL } = await import('url')
          const configUrl = pathToFileURL(configFile).href
          configModule = await import(configUrl)
        }
        
        config = configModule?.default || configModule

        // 如果存在基础配置，需要合并
        if (configFile.includes(`.${environment}.`) && await fs.pathExists(configPath)) {
          try {
            let baseConfigModule: any
            if (configPath.endsWith('.ts')) {
              try {
                const jitiMod: any = await import('jiti')
                const createJiti = (jitiMod && jitiMod.default) ? jitiMod.default : jitiMod
                const jitiLoader = createJiti(projectPath, {
                  cache: true,
                  requireCache: true,
                  interopDefault: true,
                  esmResolve: true,
                })
                baseConfigModule = jitiLoader(configPath)
              } catch (jitiError) {
                const { pathToFileURL } = await import('url')
                const baseConfigUrl = pathToFileURL(configPath).href
                baseConfigModule = await import(baseConfigUrl)
              }
            } else {
              const { pathToFileURL } = await import('url')
              const baseConfigUrl = pathToFileURL(configPath).href
              baseConfigModule = await import(baseConfigUrl)
            }
            const baseConfig = baseConfigModule?.default || baseConfigModule
            // 简单合并（深度合并）
            config = this.deepMerge(baseConfig, config)
          } catch (error) {
            // 忽略基础配置加载错误
          }
        }
      } catch (error) {
        // 配置加载失败，使用默认值
      }
    }

    // 获取打包目录
    const outDir = config.build?.outDir || 'dist'
    const buildDir = pathModule.isAbsolute(outDir) 
      ? outDir 
      : pathModule.join(projectPath, outDir)

    // 检查目录是否存在
    if (!(await fs.pathExists(buildDir))) {
      return {
        built: false,
        buildDir,
      }
    }

    // 读取目录内容
    const files = await fs.readdir(buildDir)
    
    if (files.length === 0) {
      return {
        built: false,
        buildDir,
      }
    }

    /**
     * 递归遍历目录，构建文件树并统计
     */
    interface FileTreeNode {
      name: string
      path: string
      size: number
      type: 'file' | 'directory'
      children?: FileTreeNode[]
    }

    async function buildFileTree(dirPath: string, relativePath: string = ''): Promise<FileTreeNode | null> {
      try {
        const stats = await fs.stat(dirPath)
        
        if (stats.isFile()) {
          return {
            name: pathModule.basename(dirPath),
            path: relativePath || pathModule.basename(dirPath),
            size: stats.size,
            type: 'file',
          }
        } else if (stats.isDirectory()) {
          const children: FileTreeNode[] = []
          const entries = await fs.readdir(dirPath)
          
          for (const entry of entries) {
            const entryPath = pathModule.join(dirPath, entry)
            const entryRelativePath = relativePath ? pathModule.join(relativePath, entry) : entry
            const child = await buildFileTree(entryPath, entryRelativePath)
            if (child) {
              children.push(child)
            }
          }
          
          // 递归计算目录总大小（所有子文件的大小之和）
          function calculateDirSize(nodes: FileTreeNode[]): number {
            return nodes.reduce((sum, node) => {
              if (node.type === 'file') {
                return sum + node.size
              } else if (node.children) {
                return sum + calculateDirSize(node.children)
              }
              return sum
            }, 0)
          }
          
          const dirSize = calculateDirSize(children)
          
          return {
            name: pathModule.basename(dirPath),
            path: relativePath || pathModule.basename(dirPath),
            size: dirSize,
            type: 'directory',
            children: children.sort((a, b) => {
              // 目录排在前面
              if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1
              }
              return a.name.localeCompare(b.name)
            }),
          }
        }
      } catch (error) {
        // 忽略错误
        return null
      }
      return null
    }

    /**
     * 递归统计文件数量
     */
    function countFiles(node: FileTreeNode): number {
      if (node.type === 'file') {
        return 1
      }
      if (node.children) {
        return node.children.reduce((count, child) => count + countFiles(child), 0)
      }
      return 0
    }

    /**
     * 递归计算总大小
     */
    function calculateTotalSize(node: FileTreeNode): number {
      if (node.type === 'file') {
        return node.size
      }
      if (node.children) {
        return node.children.reduce((sum, child) => sum + calculateTotalSize(child), 0)
      }
      return 0
    }

    // 构建文件树
    const fileTree = await buildFileTree(buildDir, '')
    
    if (!fileTree || fileTree.type !== 'directory') {
      return {
        built: false,
        buildDir,
      }
    }

    // 统计文件数量和总大小
    const fileCount = countFiles(fileTree)
    const totalSize = calculateTotalSize(fileTree)

    // 获取目录修改时间（作为打包时间）
    const buildDirStats = await fs.stat(buildDir)
    const buildTime = buildDirStats.mtimeMs

    return {
      built: true,
      buildTime,
      buildDir,
      files: fileTree.children || [],
      totalSize,
      fileCount,
    }
  }

  /**
   * 获取所有环境的打包状态
   * @param id - 项目 ID
   * @returns 所有已打包的环境列表
   */
  async getAllBuildStatuses(id: string): Promise<Array<{
    environment: string
    built: boolean
    buildTime?: number
    buildDir?: string
  }>> {
    const environments = ['production', 'development', 'staging', 'test', 'preview']
    const results: Array<{
      environment: string
      built: boolean
      buildTime?: number
      buildDir?: string
    }> = []

    // 并行检查所有环境的打包状态
    const statusPromises = environments.map(async (env) => {
      try {
        const status = await this.getBuildStatus(id, env)
        return {
          environment: env,
          built: status.built,
          buildTime: status.buildTime,
          buildDir: status.buildDir,
        }
      } catch (error) {
        // 如果检查失败，返回未打包状态
        return {
          environment: env,
          built: false,
        }
      }
    })

    const statuses = await Promise.all(statusPromises)
    // 只返回已打包的环境
    return statuses.filter(status => status.built)
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target }
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] })
          } else {
            output[key] = this.deepMerge(target[key], source[key])
          }
        } else {
          Object.assign(output, { [key]: source[key] })
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
   * 获取项目统计数据
   * @param id - 项目 ID
   * @returns 项目统计数据
   */
  async getProjectStats(id: string): Promise<{
    dev: {
      totalCount: number
      successCount: number
      failedCount: number
      totalDuration: number // 总运行时长（毫秒）
      averageDuration: number // 平均运行时长（毫秒）
      lastExecutedAt?: number
      environments: Record<string, {
        count: number
        successCount: number
        failedCount: number
        totalDuration: number
        averageDuration: number
      }>
    }
    build: {
      totalCount: number
      successCount: number
      failedCount: number
      successRate: number // 成功率（0-100）
      totalDuration: number // 总打包时长（毫秒）
      averageDuration: number // 平均打包时长（毫秒）
      lastExecutedAt?: number
      environments: Record<string, {
        count: number
        successCount: number
        failedCount: number
        totalDuration: number
        averageDuration: number
      }>
    }
    preview: {
      totalCount: number
      successCount: number
      failedCount: number
      totalDuration: number // 总预览时长（毫秒）
      averageDuration: number // 平均预览时长（毫秒）
      lastExecutedAt?: number
      environments: Record<string, {
        count: number
        successCount: number
        failedCount: number
        totalDuration: number
        averageDuration: number
      }>
    }
    deploy: {
      totalCount: number
      successCount: number
      failedCount: number
      successRate: number // 成功率（0-100）
      totalDuration: number // 总部署时长（毫秒）
      averageDuration: number // 平均部署时长（毫秒）
      lastExecutedAt?: number
      environments: Record<string, {
        count: number
        successCount: number
        failedCount: number
        totalDuration: number
        averageDuration: number
      }>
    }
    publish: {
      totalCount: number
      successCount: number
      failedCount: number
      successRate: number // 成功率（0-100）
      totalDuration: number // 总发布时长（毫秒）
      averageDuration: number // 平均发布时长（毫秒）
      lastExecutedAt?: number
    }
    lastActivityAt?: number // 最后一次活动时间
  }> {
    // 验证项目存在
    await this.findOne(id)

    // 获取所有执行记录
    const executions = await this.commandExecutionRepository.find({
      where: { projectId: id },
      order: { createdAt: 'DESC' },
    })

    // 初始化统计数据（包含环境分组）
    const stats = {
      dev: {
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        lastExecutedAt: undefined as number | undefined,
        environments: {} as Record<string, {
          count: number
          successCount: number
          failedCount: number
          totalDuration: number
          averageDuration: number
        }>,
      },
      build: {
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        successRate: 0,
        totalDuration: 0,
        averageDuration: 0,
        lastExecutedAt: undefined as number | undefined,
        environments: {} as Record<string, {
          count: number
          successCount: number
          failedCount: number
          totalDuration: number
          averageDuration: number
        }>,
      },
      preview: {
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        lastExecutedAt: undefined as number | undefined,
        environments: {} as Record<string, {
          count: number
          successCount: number
          failedCount: number
          totalDuration: number
          averageDuration: number
        }>,
      },
      deploy: {
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        successRate: 0,
        totalDuration: 0,
        averageDuration: 0,
        lastExecutedAt: undefined as number | undefined,
        environments: {} as Record<string, {
          count: number
          successCount: number
          failedCount: number
          totalDuration: number
          averageDuration: number
        }>,
      },
      publish: {
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        successRate: 0,
        totalDuration: 0,
        averageDuration: 0,
        lastExecutedAt: undefined as number | undefined,
        environments: {} as Record<string, {
          count: number
          successCount: number
          failedCount: number
          totalDuration: number
          averageDuration: number
        }>,
      },
      lastActivityAt: undefined as number | undefined,
    }

    /**
     * 辅助函数：初始化环境统计
     */
    const initEnvStats = () => ({
      count: 0,
      successCount: 0,
      failedCount: 0,
      totalDuration: 0,
      averageDuration: 0,
    })

    /**
     * 辅助函数：更新环境统计
     */
    const updateEnvStats = (
      envStats: { count: number; successCount: number; failedCount: number; totalDuration: number; averageDuration: number },
      exec: CommandExecution,
    ) => {
      envStats.count++
      if (exec.status === 'completed') {
        envStats.successCount++
      } else if (exec.status === 'failed' || exec.status === 'stopped') {
        envStats.failedCount++
      }
      // 使用 duration 字段（如果存在），否则使用 completedAt - createdAt
      const duration = exec.duration ?? (exec.completedAt && exec.createdAt ? exec.completedAt - exec.createdAt : 0)
      if (duration > 0) {
        envStats.totalDuration += duration
      }
    }

    // 统计各命令的数据
    for (const exec of executions) {
      const command = exec.command.toLowerCase()
      const env = exec.environment || 'default'
      
      // 更新最后活动时间
      if (!stats.lastActivityAt || exec.createdAt > stats.lastActivityAt) {
        stats.lastActivityAt = exec.createdAt
      }

      if (command === 'dev' || command === 'start') {
        stats.dev.totalCount++
        if (!stats.dev.lastExecutedAt || exec.createdAt > stats.dev.lastExecutedAt) {
          stats.dev.lastExecutedAt = exec.createdAt
        }
        
        // 初始化环境统计
        if (!stats.dev.environments[env]) {
          stats.dev.environments[env] = initEnvStats()
        }
        updateEnvStats(stats.dev.environments[env], exec)
        
        if (exec.status === 'completed') {
          stats.dev.successCount++
        } else if (exec.status === 'failed' || exec.status === 'stopped') {
          stats.dev.failedCount++
        }
        
        // 使用 duration 字段
        const duration = exec.duration ?? (exec.completedAt && exec.createdAt ? exec.completedAt - exec.createdAt : 0)
        if (duration > 0) {
          stats.dev.totalDuration += duration
        }
      } else if (command === 'build') {
        stats.build.totalCount++
        if (!stats.build.lastExecutedAt || exec.createdAt > stats.build.lastExecutedAt) {
          stats.build.lastExecutedAt = exec.createdAt
        }
        
        // 初始化环境统计
        if (!stats.build.environments[env]) {
          stats.build.environments[env] = initEnvStats()
        }
        updateEnvStats(stats.build.environments[env], exec)
        
        if (exec.status === 'completed') {
          stats.build.successCount++
        } else if (exec.status === 'failed' || exec.status === 'stopped') {
          stats.build.failedCount++
        }
        
        // 使用 duration 字段
        const duration = exec.duration ?? (exec.completedAt && exec.createdAt ? exec.completedAt - exec.createdAt : 0)
        if (duration > 0) {
          stats.build.totalDuration += duration
        }
      } else if (command === 'preview') {
        stats.preview.totalCount++
        if (!stats.preview.lastExecutedAt || exec.createdAt > stats.preview.lastExecutedAt) {
          stats.preview.lastExecutedAt = exec.createdAt
        }
        
        // 初始化环境统计
        if (!stats.preview.environments[env]) {
          stats.preview.environments[env] = initEnvStats()
        }
        updateEnvStats(stats.preview.environments[env], exec)
        
        if (exec.status === 'completed') {
          stats.preview.successCount++
        } else if (exec.status === 'failed' || exec.status === 'stopped') {
          stats.preview.failedCount++
        }
        
        // 使用 duration 字段
        const duration = exec.duration ?? (exec.completedAt && exec.createdAt ? exec.completedAt - exec.createdAt : 0)
        if (duration > 0) {
          stats.preview.totalDuration += duration
        }
      } else if (command === 'deploy') {
        stats.deploy.totalCount++
        if (!stats.deploy.lastExecutedAt || exec.createdAt > stats.deploy.lastExecutedAt) {
          stats.deploy.lastExecutedAt = exec.createdAt
        }
        
        // 初始化环境统计
        if (!stats.deploy.environments[env]) {
          stats.deploy.environments[env] = initEnvStats()
        }
        updateEnvStats(stats.deploy.environments[env], exec)
        
        if (exec.status === 'completed') {
          stats.deploy.successCount++
        } else if (exec.status === 'failed' || exec.status === 'stopped') {
          stats.deploy.failedCount++
        }
        
        // 使用 duration 字段
        const duration = exec.duration ?? (exec.completedAt && exec.createdAt ? exec.completedAt - exec.createdAt : 0)
        if (duration > 0) {
          stats.deploy.totalDuration += duration
        }
      } else if (command === 'publish') {
        stats.publish.totalCount++
        if (!stats.publish.lastExecutedAt || exec.createdAt > stats.publish.lastExecutedAt) {
          stats.publish.lastExecutedAt = exec.createdAt
        }
        
        // 初始化环境统计
        if (!stats.publish.environments[env]) {
          stats.publish.environments[env] = initEnvStats()
        }
        updateEnvStats(stats.publish.environments[env], exec)
        
        if (exec.status === 'completed') {
          stats.publish.successCount++
        } else if (exec.status === 'failed' || exec.status === 'stopped') {
          stats.publish.failedCount++
        }
        
        // 使用 duration 字段
        const duration = exec.duration ?? (exec.completedAt && exec.createdAt ? exec.completedAt - exec.createdAt : 0)
        if (duration > 0) {
          stats.publish.totalDuration += duration
        }
      }
    }

    // 计算平均时长和成功率
    const calculateAverages = (stat: {
      successCount: number
      totalDuration: number
      averageDuration: number
      environments: Record<string, {
        successCount: number
        totalDuration: number
        averageDuration: number
      }>
    }) => {
      // 计算总体平均时长
      const completedCount = stat.successCount
      if (completedCount > 0 && stat.totalDuration > 0) {
        stat.averageDuration = Math.round(stat.totalDuration / completedCount)
      }
      
      // 计算各环境的平均时长
      for (const env in stat.environments) {
        const envStat = stat.environments[env]
        if (envStat.successCount > 0 && envStat.totalDuration > 0) {
          envStat.averageDuration = Math.round(envStat.totalDuration / envStat.successCount)
        }
      }
    }

    calculateAverages(stats.dev)
    calculateAverages(stats.build)
    calculateAverages(stats.preview)
    calculateAverages(stats.deploy)
    calculateAverages(stats.publish)

    // 计算成功率
    if (stats.build.totalCount > 0) {
      stats.build.successRate = Math.round((stats.build.successCount / stats.build.totalCount) * 100)
    }
    if (stats.deploy.totalCount > 0) {
      stats.deploy.successRate = Math.round((stats.deploy.successCount / stats.deploy.totalCount) * 100)
    }
    if (stats.publish.totalCount > 0) {
      stats.publish.successRate = Math.round((stats.publish.successCount / stats.publish.totalCount) * 100)
    }

    // 计算 publish 的平均时长
    const publishCompletedCount = stats.publish.successCount
    if (publishCompletedCount > 0 && stats.publish.totalDuration > 0) {
      stats.publish.averageDuration = Math.round(stats.publish.totalDuration / publishCompletedCount)
    }

    return stats
  }
}

