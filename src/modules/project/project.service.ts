import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project, ProjectCategory, ProjectType } from './entities/project.entity.js'
import { CreateProjectDto } from './dto/create-project.dto.js'
import { UpdateProjectDto } from './dto/update-project.dto.js'
import { ImportProjectDto } from './dto/import-project.dto.js'
import { PathUtil } from '../../utils/path.util.js'
import { randomUUID } from 'crypto'
import { basename } from 'path'

/**
 * 项目管理服务
 */
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
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
}

