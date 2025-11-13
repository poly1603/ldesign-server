import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Project, ProjectType } from './entities/project.entity';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectInfoDto,
} from './dto/project.dto';

/**
 * 项目服务
 */
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * 获取所有项目
   */
  async findAll(): Promise<Project[]> {
    return this.projectRepository.find({
      order: { updatedAt: 'DESC' },
    });
  }

  /**
   * 根据ID获取项目
   */
  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`项目 ID ${id} 不存在`);
    }
    return project;
  }

  /**
   * 创建项目
   */
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // 检查路径是否已存在
    const existingProject = await this.projectRepository.findOne({
      where: { path: createProjectDto.path },
    });
    if (existingProject) {
      throw new BadRequestException('该项目路径已被导入');
    }

    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }

  /**
   * 更新项目
   */
  async update(
    id: number,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  /**
   * 删除项目
   */
  async remove(id: number): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }

  /**
   * 读取指定目录的项目信息
   */
  async readProjectInfo(projectPath: string): Promise<ProjectInfoDto> {
    // 验证路径是否存在
    if (!fs.existsSync(projectPath)) {
      throw new BadRequestException('指定的路径不存在');
    }

    // 验证是否为目录
    const stats = fs.statSync(projectPath);
    if (!stats.isDirectory()) {
      throw new BadRequestException('指定的路径不是目录');
    }

    const packageJsonPath = path.join(projectPath, 'package.json');
    const hasPackageJson = fs.existsSync(packageJsonPath);

    // 默认项目信息
    const projectInfo: ProjectInfoDto = {
      name: path.basename(projectPath),
      path: projectPath,
      type: ProjectType.STATIC,
      hasPackageJson,
    };

    // 如果有 package.json，读取详细信息
    if (hasPackageJson) {
      try {
        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);

        projectInfo.name = packageJson.name || projectInfo.name;
        projectInfo.description = packageJson.description;
        projectInfo.version = packageJson.version;
        projectInfo.dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        // 判断项目类型（检查 dependencies 和 devDependencies）
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };
        
        // 检测框架类型（前端和后端）
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // 检测后端框架
        if (deps['@nestjs/core'] || deps['@nestjs/common']) {
          projectInfo.framework = 'NestJS';
          projectInfo.type = ProjectType.PROJECT;
        } else if (deps['express']) {
          projectInfo.framework = 'Express';
          projectInfo.type = ProjectType.PROJECT;
        } else if (deps['koa']) {
          projectInfo.framework = 'Koa';
          projectInfo.type = ProjectType.PROJECT;
        } else if (deps['fastify']) {
          projectInfo.framework = 'Fastify';
          projectInfo.type = ProjectType.PROJECT;
        } else if (deps['@hapi/hapi']) {
          projectInfo.framework = 'Hapi';
          projectInfo.type = ProjectType.PROJECT;
        }
        // 检测前端框架
        else if (deps['vue']) {
          projectInfo.framework = 'Vue';
        } else if (deps['react']) {
          projectInfo.framework = 'React';
        } else if (deps['@angular/core']) {
          projectInfo.framework = 'Angular';
        } else if (deps['next']) {
          projectInfo.framework = 'Next.js';
        } else if (deps['nuxt']) {
          projectInfo.framework = 'Nuxt.js';
        } else if (deps['svelte']) {
          projectInfo.framework = 'Svelte';
        }
        
        // 检测 LDesign 特定包（优先级最高）
        const hasLauncher = !!allDeps['@ldesign/launcher'];
        const hasBuilder = !!allDeps['@ldesign/builder'];

        if (hasLauncher && hasBuilder) {
          projectInfo.type = ProjectType.HYBRID;
        } else if (hasLauncher) {
          projectInfo.type = ProjectType.PROJECT;
        } else if (hasBuilder) {
          projectInfo.type = ProjectType.LIBRARY;
        }
        // 如果没有检测到特定类型，保持默认值
        // 已检测到后端框架的会被设置为 PROJECT
        // 前端框架项目会保持为 STATIC（除非有 LDesign 包）
      } catch (error) {
        throw new BadRequestException('package.json 文件格式错误');
      }
    }

    return projectInfo;
  }

  /**
   * 导入项目（读取信息并保存到数据库）
   */
  async importProject(projectPath: string): Promise<Project> {
    const projectInfo = await this.readProjectInfo(projectPath);

    const createDto: CreateProjectDto = {
      name: projectInfo.name,
      path: projectInfo.path,
      description: projectInfo.description,
      version: projectInfo.version,
      type: projectInfo.type,
      framework: projectInfo.framework,
      dependencies: projectInfo.dependencies,
    };

    return this.create(createDto);
  }

  /**
   * 获取系统中的目录列表（用于目录选择）
   */
  async listDirectories(parentPath?: string): Promise<string[]> {
    try {
      // 如果没有指定路径，返回系统盘符（Windows）或根目录内容
      if (!parentPath) {
        if (process.platform === 'win32') {
          // Windows: 返回所有驱动器
          const drives: string[] = [];
          for (let i = 65; i <= 90; i++) {
            const drive = String.fromCharCode(i) + ':\\';
            if (fs.existsSync(drive)) {
              drives.push(drive);
            }
          }
          return drives;
        } else {
          // Unix-like: 返回根目录
          parentPath = '/';
        }
      }

      // 验证路径存在
      if (!fs.existsSync(parentPath)) {
        throw new BadRequestException('路径不存在');
      }

      // 读取目录内容
      const items = fs.readdirSync(parentPath);
      const directories: string[] = [];

      for (const item of items) {
        try {
          const fullPath = path.join(parentPath, item);
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            directories.push(fullPath);
          }
        } catch (error) {
          // 跳过无法访问的目录
          continue;
        }
      }

      return directories.sort();
    } catch (error) {
      throw new BadRequestException('无法读取目录: ' + error.message);
    }
  }
}
