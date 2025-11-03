import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ProjectService } from './project.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ImportProjectDto } from './dto/import-project.dto'

/**
 * 项目管理控制器
 */
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  /**
   * 获取项目列表
   * @returns 项目列表
   */
  @Get()
  async findAll() {
    const projects = await this.projectService.findAll()
    return {
      success: true,
      data: projects,
    }
  }

  /**
   * 获取项目详情
   * @param id - 项目 ID
   * @returns 项目详情
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const project = await this.projectService.findOne(id)
    return {
      success: true,
      data: project,
    }
  }

  /**
   * 创建新项目
   * @param createProjectDto - 创建项目 DTO
   * @returns 创建的项目
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProjectDto: CreateProjectDto) {
    const project = await this.projectService.create(createProjectDto)
    return {
      success: true,
      data: project,
      message: '项目创建成功',
    }
  }

  /**
   * 导入项目
   * @param importProjectDto - 导入项目 DTO
   * @returns 导入的项目
   */
  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  async import(@Body() importProjectDto: ImportProjectDto) {
    const project = await this.projectService.import(importProjectDto)
    return {
      success: true,
      data: project,
      message: '项目导入成功',
    }
  }

  /**
   * 更新项目
   * @param id - 项目 ID
   * @param updateProjectDto - 更新项目 DTO
   * @returns 更新后的项目
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    const project = await this.projectService.update(id, updateProjectDto)
    return {
      success: true,
      data: project,
      message: '项目更新成功',
    }
  }

  /**
   * 删除项目
   * @param id - 项目 ID
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.projectService.remove(id)
    return {
      success: true,
      message: '项目删除成功',
    }
  }

  /**
   * 更新项目最后打开时间
   * @param id - 项目 ID
   */
  @Post(':id/open')
  async open(@Param('id') id: string) {
    await this.projectService.updateLastOpenedAt(id)
    return {
      success: true,
      message: '项目打开时间已更新',
    }
  }
}

