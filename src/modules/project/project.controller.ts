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
   * 在系统文件管理器中打开项目文件夹
   * @param id - 项目 ID
   * @returns 打开结果
   * 
   * 注意：这个路由必须放在 @Post(':id/open') 之前，因为 NestJS 按顺序匹配路由
   * 如果 ':id/open' 在前，会先匹配到 'open-folder' 路径
   */
  @Post(':id/open-folder')
  @ApiOperation({ summary: 'Open project folder in system file explorer' })
  @ApiResponse({ status: 200, description: 'Folder opened' })
  async openFolder(@Param('id') id: string) {
    await this.projectService.openFolder(id)
    return {
      success: true,
      message: '文件夹已打开',
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
    const execution = await this.projectCommandService.executeCommand(
      id,
      executeCommandDto.command,
      executeCommandDto.environment,
    )
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
   * @param environment - 环境名称（可选）
   * @returns 最新的执行记录
   */
  @Get(':id/command/:command/latest')
  @ApiOperation({ summary: 'Get latest command execution' })
  @ApiResponse({ status: 200, description: 'Latest execution retrieved' })
  @ApiQuery({ name: 'environment', required: false, description: 'Environment name' })
  async getLatestExecution(
    @Param('id') id: string,
    @Param('command') command: string,
    @Query('environment') environment?: string,
  ) {
    const execution = await this.projectCommandService.getLatestExecution(id, command, environment)
    return {
      success: true,
      data: execution,
    }
  }

  /**
   * 获取项目的所有运行中的命令执行记录
   * @param id - 项目 ID
   * @param command - 命令名称（可选）
   * @returns 运行中的执行记录列表
   */
  @Get(':id/command/running')
  @ApiOperation({ summary: 'Get all running command executions' })
  @ApiResponse({ status: 200, description: 'Running executions retrieved' })
  @ApiQuery({ name: 'command', required: false, description: 'Command name' })
  async getRunningExecutions(
    @Param('id') id: string,
    @Query('command') command?: string,
  ) {
    const executions = await this.projectCommandService.getRunningExecutions(id, command)
    return {
      success: true,
      data: executions,
    }
  }

  /**
   * 获取项目的所有执行记录（包括历史记录）
   * @param id - 项目 ID
   * @param command - 命令名称（可选）
   * @param status - 状态筛选（可选）
   * @param limit - 返回记录数限制（默认 50）
   * @returns 执行记录列表
   */
  @Get(':id/command/executions')
  @ApiOperation({ summary: 'Get all command executions (including history)' })
  @ApiResponse({ status: 200, description: 'Executions retrieved' })
  @ApiQuery({ name: 'command', required: false, description: 'Command name' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'running', 'completed', 'failed', 'stopped'], description: 'Status filter' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit number of records (default: 50)' })
  async getExecutions(
    @Param('id') id: string,
    @Query('command') command?: string,
    @Query('status') status?: 'pending' | 'running' | 'completed' | 'failed' | 'stopped',
    @Query('limit') limit?: number,
  ) {
    const executions = await this.projectCommandService.getExecutions(id, command, status, limit ? Number(limit) : 50)
    return {
      success: true,
      data: executions,
    }
  }

  /**
   * 获取项目的历史执行记录（已完成、失败、停止的记录）
   * @param id - 项目 ID
   * @param command - 命令名称（可选）
   * @param limit - 返回记录数限制（默认 100）
   * @returns 历史执行记录列表
   */
  @Get(':id/command/history')
  @ApiOperation({ summary: 'Get command execution history' })
  @ApiResponse({ status: 200, description: 'History executions retrieved' })
  @ApiQuery({ name: 'command', required: false, description: 'Command name' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit number of records (default: 100)' })
  async getHistoryExecutions(
    @Param('id') id: string,
    @Query('command') command?: string,
    @Query('limit') limit?: number,
  ) {
    const executions = await this.projectCommandService.getHistoryExecutions(id, command, limit ? Number(limit) : 100)
    return {
      success: true,
      data: executions,
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

  /**
   * 检查项目的打包状态
   * @param id - 项目 ID
   * @param environment - 环境名称
   * @returns 打包状态信息
   */
  @Get(':id/build-status')
  @ApiOperation({ summary: 'Check project build status' })
  @ApiResponse({ status: 200, description: 'Build status retrieved' })
  @ApiQuery({ name: 'environment', required: false, description: 'Environment name' })
  async getBuildStatus(
    @Param('id') id: string,
    @Query('environment') environment?: string,
  ) {
    const status = await this.projectService.getBuildStatus(id, environment || 'production')
    return {
      success: true,
      data: status,
    }
  }

  /**
   * 获取所有环境的打包状态
   * @param id - 项目 ID
   * @returns 所有已打包的环境列表
   */
  @Get(':id/build-statuses')
  @ApiOperation({ summary: 'Get all environments build statuses' })
  @ApiResponse({ status: 200, description: 'All build statuses retrieved' })
  async getAllBuildStatuses(@Param('id') id: string) {
    const statuses = await this.projectService.getAllBuildStatuses(id)
    return {
      success: true,
      data: statuses,
    }
  }

  /**
   * 获取项目统计数据
   * @param id - 项目 ID
   * @returns 项目统计数据
   */
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get project statistics' })
  @ApiResponse({ status: 200, description: 'Project statistics retrieved' })
  async getProjectStats(@Param('id') id: string) {
    const stats = await this.projectService.getProjectStats(id)
    return {
      success: true,
      data: stats,
    }
  }

  /**
   * 获取库项目的打包产物信息
   * @param id - 项目 ID
   * @returns 打包产物信息
   */
  @Get(':id/library-build-status')
  @ApiOperation({ summary: 'Get library build artifacts status' })
  @ApiResponse({ status: 200, description: 'Library build status retrieved' })
  async getLibraryBuildStatus(@Param('id') id: string) {
    const status = await this.projectService.getLibraryBuildStatus(id)
    return {
      success: true,
      data: status,
    }
  }
}

