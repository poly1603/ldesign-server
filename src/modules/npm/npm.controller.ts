import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, Query, HttpException } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { NpmService } from './npm.service.js'
import { CreateNpmRegistryDto, UpdateNpmRegistryDto, NpmLoginDto, PaginationDto } from './dto/npm.dto.js'

@ApiTags('NPM 仓库管理')
@Controller('api/npm')
export class NpmController {
  constructor(private readonly npmService: NpmService) {}

  @Get('registries')
  @ApiOperation({ summary: '获取所有 NPM 仓库配置' })
  @ApiResponse({ status: 200, description: '成功' })
  async findAll() {
    const registries = await this.npmService.findAll()
    return {
      success: true,
      data: registries,
    }
  }

  @Get('registries/:id')
  @ApiOperation({ summary: '获取单个 NPM 仓库配置' })
  @ApiResponse({ status: 200, description: '成功' })
  async findOne(@Param('id') id: string) {
    const registry = await this.npmService.findOne(id)
    return {
      success: true,
      data: registry,
    }
  }

  @Post('registries')
  @ApiOperation({ summary: '创建 NPM 仓库配置' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() createDto: CreateNpmRegistryDto) {
    const registry = await this.npmService.create(createDto)
    return {
      success: true,
      data: registry,
    }
  }

  @Put('registries/:id')
  @ApiOperation({ summary: '更新 NPM 仓库配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateNpmRegistryDto) {
    const registry = await this.npmService.update(id, updateDto)
    return {
      success: true,
      data: registry,
    }
  }

  @Delete('registries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除 NPM 仓库配置' })
  @ApiResponse({ status: 204, description: '删除成功' })
  async remove(@Param('id') id: string) {
    await this.npmService.remove(id)
  }

  @Post('login')
  @ApiOperation({ summary: 'NPM 登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 500, description: '登录失败' })
  async login(@Body() loginDto: NpmLoginDto) {
    try {
      const result = await this.npmService.login(loginDto)
      return {
        success: true,
        data: result,
      }
    } catch (error: any) {
      // 记录详细错误信息到控制台
      const errorInfo = {
        message: error?.message || '未知错误',
        stack: error?.stack,
        name: error?.name,
        loginDto: {
          registryId: loginDto.registryId,
          username: loginDto.username,
          email: loginDto.email,
          password: '***',
        },
      }
      
      console.error('[NPM Controller] 登录失败:', JSON.stringify(errorInfo, null, 2))
      
      // 如果已经是 HttpException，直接抛出（让全局过滤器处理）
      if (error instanceof HttpException) {
        throw error
      }
      
      // 创建 HttpException，确保错误信息能正确传递
      const errorMessage = error?.message || 'NPM 登录失败'
      const httpException = new HttpException(
        {
          success: false,
          message: errorMessage,
          error: 'Internal Server Error',
          details: process.env.NODE_ENV === 'development' 
            ? {
                stack: error?.stack,
                name: error?.name,
                originalError: error?.toString(),
              }
            : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
      
      // 抛出异常，让全局过滤器处理
      throw httpException
    }
  }

  @Post('logout/:id')
  @ApiOperation({ summary: 'NPM 登出' })
  @ApiResponse({ status: 200, description: '登出成功' })
  async logout(@Param('id') id: string) {
    await this.npmService.logout(id)
    return {
      success: true,
      message: '登出成功',
    }
  }

  @Get('registries/:id/status')
  @ApiOperation({ summary: '检查登录状态' })
  @ApiResponse({ status: 200, description: '成功' })
  async checkLoginStatus(@Param('id') id: string) {
    const status = await this.npmService.checkLoginStatus(id)
    return {
      success: true,
      data: status,
    }
  }

  @Get('registries/:id/packages')
  @ApiOperation({ summary: '获取当前登录用户发布的包列表（支持分页）' })
  @ApiResponse({ status: 200, description: '成功' })
  async getPackages(
    @Param('id') id: string,
    @Query() paginationDto: PaginationDto,
  ) {
    // 确保参数是有效的数字，提供默认值
    const page = paginationDto.page && paginationDto.page > 0 ? paginationDto.page : 1
    const pageSize = paginationDto.pageSize && paginationDto.pageSize > 0 && paginationDto.pageSize <= 100
      ? paginationDto.pageSize
      : 20
    
    const result = await this.npmService.getPackages(id, page, pageSize)
    return {
      success: true,
      data: result,
    }
  }

  @Get('registries/:id/packages/:packageName')
  @ApiOperation({ summary: '获取包详情信息' })
  @ApiResponse({ status: 200, description: '成功' })
  async getPackageDetail(
    @Param('id') id: string,
    @Param('packageName') packageName: string,
  ) {
    const result = await this.npmService.getPackageDetail(id, decodeURIComponent(packageName))
    return {
      success: true,
      data: result,
    }
  }

  @Post('verdaccio/install')
  @ApiOperation({ summary: '安装 Verdaccio（全局安装）' })
  @ApiResponse({ status: 200, description: '安装成功' })
  async installVerdaccio() {
    try {
      await this.npmService.installVerdaccio()
      return {
        success: true,
        message: 'Verdaccio 安装成功',
      }
    } catch (error: any) {
      const errorInfo = {
        message: error?.message || '未知错误',
        stack: error?.stack,
        name: error?.name,
      }
      
      console.error('[NPM Controller] 安装 Verdaccio 失败:', JSON.stringify(errorInfo, null, 2))
      
      if (error instanceof HttpException) {
        throw error
      }
      
      const errorMessage = error?.message || '安装 Verdaccio 失败'
      const httpException = new HttpException(
        {
          success: false,
          message: errorMessage,
          error: 'Internal Server Error',
          details: process.env.NODE_ENV === 'development' 
            ? {
                stack: error?.stack,
                name: error?.name,
                originalError: error?.toString(),
              }
            : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
      
      throw httpException
    }
  }

  @Post('verdaccio/start')
  @ApiOperation({ summary: '启动本地 Verdaccio 服务' })
  @ApiResponse({ status: 200, description: '启动成功' })
  async startLocalVerdaccio(@Body() body?: { port?: number }) {
    try {
      const result = await this.npmService.startLocalVerdaccio(body?.port)
      return {
        success: true,
        data: result,
      }
    } catch (error: any) {
      // 记录详细错误信息到控制台
      const errorInfo = {
        message: error?.message || '未知错误',
        stack: error?.stack,
        name: error?.name,
        logs: (error as any)?.logs || [],
      }
      
      console.error('[NPM Controller] 启动 Verdaccio 失败:', JSON.stringify(errorInfo, null, 2))
      
      // 如果已经是 HttpException，直接抛出（让全局过滤器处理）
      if (error instanceof HttpException) {
        throw error
      }
      
      // 创建 HttpException，确保错误信息能正确传递
      const errorMessage = error?.message || '启动 Verdaccio 失败'
      const httpException = new HttpException(
        {
          success: false,
          message: errorMessage,
          error: 'Internal Server Error',
          logs: (error as any)?.logs || [],
          details: process.env.NODE_ENV === 'development' 
            ? {
                stack: error?.stack,
                name: error?.name,
                originalError: error?.toString(),
              }
            : undefined,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
      
      // 抛出异常，让全局过滤器处理
      throw httpException
    }
  }

  @Post('verdaccio/stop')
  @ApiOperation({ summary: '停止本地 Verdaccio 服务' })
  @ApiResponse({ status: 200, description: '停止成功' })
  async stopLocalVerdaccio() {
    await this.npmService.stopLocalVerdaccio()
    return {
      success: true,
      message: 'Verdaccio 服务已停止',
    }
  }

  @Post('verdaccio/restart')
  @ApiOperation({ summary: '重启本地 Verdaccio 服务' })
  @ApiResponse({ status: 200, description: '重启成功' })
  async restartLocalVerdaccio(@Body() body?: { port?: number }) {
    try {
      const result = await this.npmService.restartLocalVerdaccio(body?.port)
      return {
        success: true,
        data: result,
        message: 'Verdaccio 服务重启成功',
      }
    } catch (error: any) {
      const errorInfo = {
        message: error?.message || '重启 Verdaccio 失败',
        stack: error?.stack,
        name: error?.name,
      }
      
      console.error('[NPM Controller] 重启 Verdaccio 失败:', JSON.stringify(errorInfo, null, 2))
      
      if (error instanceof HttpException) {
        throw error
      }
      
      const errorMessage = error?.message || '重启 Verdaccio 失败'
      throw new HttpException(
        {
          success: false,
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post('registries/:id/verdaccio/restart')
  @ApiOperation({ summary: '重启指定仓库的 Verdaccio 服务' })
  @ApiResponse({ status: 200, description: '重启成功' })
  async restartVerdaccioByRegistryId(@Param('id') id: string) {
    try {
      // 获取仓库信息，提取端口
      const registry = await this.npmService.findOne(id)
      const registryUrl = registry.registry.toLowerCase().replace(/\/$/, '')
      const registryName = (registry.name || '').toLowerCase()
      
      // 判断是否为本地 Verdaccio
      const isLocalhost = registryUrl.includes('localhost') || registryUrl.includes('127.0.0.1')
      const hasVerdaccioName = registryName.includes('verdaccio')
      
      if (!isLocalhost || !hasVerdaccioName) {
        throw new HttpException(
          {
            success: false,
            message: '该仓库不是本地 Verdaccio 仓库',
          },
          HttpStatus.BAD_REQUEST,
        )
      }
      
      // 从 URL 中提取端口
      const urlMatch = registry.registry.match(/localhost:(\d+)/i) || registry.registry.match(/127\.0\.0\.1:(\d+)/i)
      const port = urlMatch ? parseInt(urlMatch[1], 10) : undefined
      
      const result = await this.npmService.restartLocalVerdaccio(port, id)
      return {
        success: true,
        data: result,
        message: 'Verdaccio 服务重启成功',
      }
    } catch (error: any) {
      const errorInfo = {
        message: error?.message || '重启 Verdaccio 失败',
        stack: error?.stack,
        name: error?.name,
      }
      
      console.error('[NPM Controller] 重启 Verdaccio 失败:', JSON.stringify(errorInfo, null, 2))
      
      if (error instanceof HttpException) {
        throw error
      }
      
      const errorMessage = error?.message || '重启 Verdaccio 失败'
      throw new HttpException(
        {
          success: false,
          message: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Get('verdaccio/status')
  @ApiOperation({ summary: '获取本地 Verdaccio 服务状态' })
  @ApiResponse({ status: 200, description: '成功' })
  async getLocalVerdaccioStatus() {
    const status = await this.npmService.getLocalVerdaccioStatus()
    return {
      success: true,
      data: status,
    }
  }

  @Get('registries/:id/supports-user-registration')
  @ApiOperation({ summary: '检查仓库是否支持用户注册' })
  @ApiResponse({ status: 200, description: '成功' })
  async checkRegistrySupportsUserRegistration(@Param('id') id: string) {
    const result = await this.npmService.checkRegistrySupportsUserRegistration(id)
    return {
      success: true,
      data: result,
    }
  }

  @Post('registries/:id/create-user')
  @ApiOperation({ summary: '在 Verdaccio 中创建新用户' })
  @ApiResponse({ status: 200, description: '创建成功' })
  async createVerdaccioUser(
    @Param('id') id: string,
    @Body() body: { username: string; password: string; email: string },
  ) {
    await this.npmService.createVerdaccioUser(id, body.username, body.password, body.email)
    return {
      success: true,
      message: '用户创建成功',
    }
  }

  @Get('registries/:id/verdaccio/config')
  @ApiOperation({ summary: '获取 Verdaccio 配置文件' })
  @ApiResponse({ status: 200, description: '成功' })
  async getVerdaccioConfig(@Param('id') id: string) {
    const config = await this.npmService.getVerdaccioConfig(id)
    return {
      success: true,
      data: config,
    }
  }

  @Put('registries/:id/verdaccio/config')
  @ApiOperation({ summary: '保存 Verdaccio 配置文件' })
  @ApiResponse({ status: 200, description: '保存成功' })
  async saveVerdaccioConfig(
    @Param('id') id: string,
    @Body() body: { content: string; restart?: boolean },
  ) {
    // Service 层会自动处理重启逻辑（如果 Verdaccio 正在运行）
    await this.npmService.saveVerdaccioConfig(id, body.content)
    
    // 检查服务状态，用于返回给前端
    const status = await this.npmService.getLocalVerdaccioStatus()
    
    // 如果服务正在运行，说明已启动重启流程（service 层会自动重启）
    if (status.running && status.port) {
      return {
        success: true,
        message: '配置保存成功，Verdaccio 服务正在重启...',
        data: {
          restarted: true,
        },
      }
    }
    
    // 如果服务未运行，说明无需重启
    return {
      success: true,
      message: '配置保存成功',
      data: {
        restarted: false,
        serviceNotRunning: true,
      },
    }
  }

  @Get('registries/:id/verdaccio/config/parsed')
  @ApiOperation({ summary: '获取 Verdaccio 配置文件（解析为对象）' })
  @ApiResponse({ status: 200, description: '成功' })
  async getVerdaccioConfigParsed(@Param('id') id: string) {
    const config = await this.npmService.parseVerdaccioConfig(id)
    return {
      success: true,
      data: config,
    }
  }

  @Put('registries/:id/verdaccio/config/parsed')
  @ApiOperation({ summary: '保存 Verdaccio 配置文件（从对象）' })
  @ApiResponse({ status: 200, description: '保存成功' })
  async saveVerdaccioConfigParsed(
    @Param('id') id: string,
    @Body() body: { config: any; restart?: boolean },
  ) {
    // Service 层会自动处理重启逻辑（如果 Verdaccio 正在运行）
    await this.npmService.saveVerdaccioConfigFromObject(id, body.config)
    
    // 检查服务状态，用于返回给前端
    const status = await this.npmService.getLocalVerdaccioStatus()
    
    // 如果服务正在运行，说明已启动重启流程（service 层会自动重启）
    if (status.running && status.port) {
      return {
        success: true,
        message: '配置保存成功，Verdaccio 服务正在重启...',
        data: {
          restarted: true,
        },
      }
    }
    
    // 如果服务未运行，说明无需重启
    return {
      success: true,
      message: '配置保存成功',
      data: {
        restarted: false,
        serviceNotRunning: true,
      },
    }
  }

  @Get('verdaccio/config/schema')
  @ApiOperation({ summary: '获取 Verdaccio 配置项结构定义' })
  @ApiResponse({ status: 200, description: '成功' })
  async getVerdaccioConfigSchema() {
    const schema = this.npmService.getVerdaccioConfigSchema()
    return {
      success: true,
      data: schema,
    }
  }
}

