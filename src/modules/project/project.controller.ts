import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { ProjectService } from './project.service.js'
import { ProjectCommandService } from './project-command.service.js'
import { CreateProjectDto } from './dto/create-project.dto.js'
import { UpdateProjectDto } from './dto/update-project.dto.js'
import { ImportProjectDto } from './dto/import-project.dto.js'
import { AnalyzeProjectDto } from './dto/analyze-project.dto.js'
import { ExecuteCommandDto } from './dto/execute-command.dto.js'
import { ProjectCategory, ProjectType } from './entities/project.entity.js'

/**
 * 项目管理控制器
 */
@ApiTags('projects')
@Controller('api/projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly projectCommandService: ProjectCommandService,
  ) {}

  /**
   * 获取项目列表（支持查询、排序、分类）
   * @param search - 搜索关键词
   * @param category - 项目类别
   * @param type - 项目类型
   * @param framework - 框架类型
   * @param sortBy - 排序字段
   * @param sortOrder - 排序方向
   * @returns 项目列表
   */
  @Get()
  @ApiOperation({ summary: 'List all projects with filters' })
  @ApiResponse({ status: 200, description: 'Projects listed' })
  @ApiQuery({ name: 'search', required: false, description: 'Search keyword' })
  @ApiQuery({ name: 'category', required: false, enum: ['project', 'library', 'project-library', 'other'], description: 'Project category' })
  @ApiQuery({ name: 'type', required: false, enum: ['web', 'api', 'library', 'mobile', 'desktop', 'other'], description: 'Project type' })
  @ApiQuery({ name: 'framework', required: false, description: 'Framework type' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'createdAt', 'updatedAt', 'lastOpenedAt'], description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: ProjectCategory,
    @Query('type') type?: ProjectType,
    @Query('framework') framework?: string,
    @Query('sortBy') sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastOpenedAt',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const projects = await this.projectService.findAll({
      search,
      category,
      type,
      framework,
      sortBy,
      sortOrder,
    })
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
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved' })
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
  @ApiOperation({ summary: 'Create new project' })
  @ApiResponse({ status: 201, description: 'Project created' })
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
   * 分析项目（不保存到数据库）
   * @param analyzeProjectDto - 分析项目 DTO
   * @returns 项目分析结果
   */
  @Post('analyze')
  @ApiOperation({ summary: 'Analyze project without saving' })
  @ApiResponse({ status: 200, description: 'Project analyzed' })
  async analyze(@Body() analyzeProjectDto: AnalyzeProjectDto) {
    const analysis = await this.projectService.analyzeProject(analyzeProjectDto.path)
    return {
      success: true,
      data: analysis,
    }
  }

  /**
   * 导入项目（会先分析项目信息）
   * @param importProjectDto - 导入项目 DTO
   * @returns 导入的项目
   */
  @Post('import')
  @ApiOperation({ summary: 'Import existing project' })
  @ApiResponse({ status: 201, description: 'Project imported' })
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
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated' })
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
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
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
  @ApiOperation({ summary: 'Open project (update last opened time)' })
  @ApiResponse({ status: 200, description: 'Project opened' })
  async open(@Param('id') id: string) {
    await this.projectService.updateLastOpenedAt(id)
    return {
      success: true,
      message: '项目打开时间已更新',
    }
  }

  /**
   * 执行项目命令
   * @param id - 项目 ID
   * @param executeCommandDto - 执行命令 DTO
   * @returns 命令执行记录
   */
  @Post(':id/command')
  @ApiOperation({ summary: 'Execute project command' })
  @ApiResponse({ status: 200, description: 'Command executed' })
  async executeCommand(
    @Param('id') id: string,
    @Body() executeCommandDto: ExecuteCommandDto,
  ) {
    const execution = await this.projectCommandService.executeCommand(id, executeCommandDto.command)
    return {
      success: true,
      data: execution,
      message: '命令执行成功',
    }
  }

  /**
   * 停止命令执行
   * @param id - 项目 ID
   * @param executionId - 执行记录 ID
   * @returns 停止结果
   */
  @Post(':id/command/:executionId/stop')
  @ApiOperation({ summary: 'Stop command execution' })
  @ApiResponse({ status: 200, description: 'Command stopped' })
  async stopCommand(
    @Param('id') id: string,
    @Param('executionId') executionId: string,
  ) {
    await this.projectCommandService.stopCommand(executionId)
    return {
      success: true,
      message: '命令已停止',
    }
  }

  /**
   * 获取最新的命令执行记录
   * @param id - 项目 ID
   * @param command - 命令名称
   * @returns 最新的执行记录
   */
  @Get(':id/command/:command/latest')
  @ApiOperation({ summary: 'Get latest command execution' })
  @ApiResponse({ status: 200, description: 'Latest execution retrieved' })
  async getLatestExecution(
    @Param('id') id: string,
    @Param('command') command: string,
  ) {
    const execution = await this.projectCommandService.getLatestExecution(id, command)
    return {
      success: true,
      data: execution,
    }
  }

  /**
   * 清除项目的执行记录
   * @param id - 项目 ID
   * @param command - 命令名称（可选）
   * @returns 清除结果
   */
  @Delete(':id/command')
  @ApiOperation({ summary: 'Clear project command executions' })
  @ApiResponse({ status: 200, description: 'Executions cleared' })
  async clearExecutions(
    @Param('id') id: string,
    @Query('command') command?: string,
  ) {
    await this.projectCommandService.clearExecutions(id, command)
    return {
      success: true,
      message: '执行记录已清除',
    }
  }
}

