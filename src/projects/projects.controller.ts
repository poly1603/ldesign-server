import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ImportProjectDto,
  ProjectInfoDto,
} from './dto/project.dto';
import {
  DevDto,
  BuildDto,
  PreviewDto,
  ProcessResponseDto,
} from './dto/launcher.dto';
import { Project } from './entities/project.entity';
import { ApiSuccessResponse } from '../common/decorators/api-response.decorator';
import { LauncherService } from '../service/launcher.service';

/**
 * 项目管理控制器
 */
@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly launcherService: LauncherService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取所有项目' })
  @ApiSuccessResponse('获取项目列表成功')
  async findAll(): Promise<Project[]> {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个项目' })
  @ApiSuccessResponse('获取项目详情成功')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建项目' })
  @ApiSuccessResponse('创建项目成功')
  async create(@Body() createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(createProjectDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目' })
  @ApiSuccessResponse('更新项目成功')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目' })
  @ApiSuccessResponse('删除项目成功')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.projectsService.remove(id);
  }

  @Post('read-info')
  @ApiOperation({ summary: '读取项目目录信息（不保存到数据库）' })
  @ApiResponse({
    status: 200,
    description: '读取项目信息成功',
    type: ProjectInfoDto,
  })
  @ApiSuccessResponse('读取项目信息成功')
  async readProjectInfo(
    @Body() importProjectDto: ImportProjectDto,
  ): Promise<ProjectInfoDto> {
    return this.projectsService.readProjectInfo(importProjectDto.path);
  }

  @Post('import')
  @ApiOperation({ summary: '导入项目（读取信息并保存到数据库）' })
  @ApiSuccessResponse('导入项目成功')
  async importProject(
    @Body() importProjectDto: ImportProjectDto,
  ): Promise<Project> {
    return this.projectsService.importProject(importProjectDto.path);
  }

  @Get('directories/list')
  @ApiOperation({ summary: '获取目录列表（用于目录选择）' })
  @ApiQuery({
    name: 'path',
    required: false,
    description: '父目录路径，不传则返回根目录或驱动器列表',
  })
  @ApiSuccessResponse('获取目录列表成功')
  async listDirectories(@Query('path') path?: string): Promise<string[]> {
    return this.projectsService.listDirectories(path);
  }

  @Post(':id/dev')
  @ApiOperation({ summary: '启动开发服务器' })
  @ApiSuccessResponse('启动开发服务器成功')
  async dev(
    @Param('id', ParseIntPipe) id: number,
    @Body() devDto: DevDto,
  ): Promise<ProcessResponseDto> {
    const project = await this.projectsService.findOne(id);
    const process = await this.launcherService.dev(id, {
      projectPath: project.path,
      mode: devDto.mode,
      port: devDto.port,
      host: devDto.host,
    });

    return {
      pid: process.pid,
      projectId: process.projectId,
      command: process.command,
      status: process.status,
      startTime: process.startTime,
    };
  }

  @Post(':id/build')
  @ApiOperation({ summary: '构建项目' })
  @ApiSuccessResponse('构建项目成功')
  async build(
    @Param('id', ParseIntPipe) id: number,
    @Body() buildDto: BuildDto,
  ): Promise<ProcessResponseDto> {
    const project = await this.projectsService.findOne(id);
    const process = await this.launcherService.build(id, {
      projectPath: project.path,
      mode: buildDto.mode,
    });

    return {
      pid: process.pid,
      projectId: process.projectId,
      command: process.command,
      status: process.status,
      startTime: process.startTime,
    };
  }

  @Post(':id/preview')
  @ApiOperation({ summary: '预览构建结果' })
  @ApiSuccessResponse('预览构建结果成功')
  async preview(
    @Param('id', ParseIntPipe) id: number,
    @Body() previewDto: PreviewDto,
  ): Promise<ProcessResponseDto> {
    const project = await this.projectsService.findOne(id);
    const process = await this.launcherService.preview(id, {
      projectPath: project.path,
      port: previewDto.port,
      host: previewDto.host,
    });

    return {
      pid: process.pid,
      projectId: process.projectId,
      command: process.command,
      status: process.status,
      startTime: process.startTime,
    };
  }

  @Post(':id/stop/:command')
  @ApiOperation({ summary: '停止进程' })
  @ApiSuccessResponse('停止进程成功')
  async stop(
    @Param('id', ParseIntPipe) id: number,
    @Param('command') command: string,
  ): Promise<void> {
    const key = `${id}-${command}`;
    await this.launcherService.stop(key);
  }
}
