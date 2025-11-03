import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Project } from './entities/project.entity'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ImportProjectDto } from './dto/import-project.dto'
import { PathUtil } from '../../utils/path.util'
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
   * 获取所有项目
   * @returns 项目列表
   */
  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      order: { lastOpenedAt: 'DESC', updatedAt: 'DESC' },
    })
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

    // 创建项目
    const project = this.projectRepository.create({
      id: randomUUID(),
      name: createProjectDto.name,
      path: normalizedPath,
      type: createProjectDto.type,
      framework: createProjectDto.framework,
      packageManager: createProjectDto.packageManager,
      description: createProjectDto.description,
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

    // 尝试检测项目类型和框架
    const detected = await this.detectProjectInfo(normalizedPath)

    // 创建项目
    const project = this.projectRepository.create({
      id: randomUUID(),
      name: projectName,
      path: normalizedPath,
      type: detected.type,
      framework: detected.framework,
      packageManager: detected.packageManager,
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
   * 检测项目信息
   * @param path - 项目路径
   * @returns 检测到的项目信息
   */
  private async detectProjectInfo(path: string): Promise<{
    type: Project['type']
    framework?: string
    packageManager?: string
  }> {
    const fs = await import('fs-extra')
    const packageJsonPath = `${path}/package.json`

    let type: Project['type'] = 'other'
    let framework: string | undefined
    let packageManager: string | undefined

    // 检查 package.json
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = await fs.readJson(packageJsonPath)

        // 检测包管理器
        if (await fs.pathExists(`${path}/pnpm-lock.yaml`)) {
          packageManager = 'pnpm'
        } else if (await fs.pathExists(`${path}/yarn.lock`)) {
          packageManager = 'yarn'
        } else if (await fs.pathExists(`${path}/package-lock.json`)) {
          packageManager = 'npm'
        }

        // 检测框架
        const deps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        }

        if (deps.vue || deps['@vue/cli-service']) {
          framework = 'vue'
          type = 'web'
        } else if (deps.react || deps['react-dom']) {
          framework = 'react'
          type = 'web'
        } else if (deps['@angular/core']) {
          framework = 'angular'
          type = 'web'
        } else if (deps.next) {
          framework = 'next'
          type = 'web'
        } else if (deps.nuxt || deps['nuxt3']) {
          framework = 'nuxt'
          type = 'web'
        } else if (deps.express || deps['@nestjs/core']) {
          framework = packageJson.dependencies['@nestjs/core'] ? 'nestjs' : 'express'
          type = 'api'
        } else if (packageJson.name?.startsWith('@') || packageJson.main || packageJson.module) {
          type = 'library'
        }
      } catch (error) {
        // 忽略解析错误
      }
    }

    return { type, framework, packageManager }
  }
}

