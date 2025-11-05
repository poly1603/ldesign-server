import { Controller, Get, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { SystemService } from './system.service.js'

/**
 * 系统工具控制器
 */
@ApiTags('system')
@Controller('api/system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  /**
   * 验证路径是否有效
   * @param body - 请求体，包含 path 和验证选项
   * @returns 验证结果
   */
  @Post('validate-path')
  @ApiOperation({ summary: 'Validate file system path' })
  @ApiResponse({ status: 200, description: 'Path validated' })
  validatePath(
    @Body()
    body: {
      path: string
      mustExist?: boolean
      mustBeDirectory?: boolean
      mustBeFile?: boolean
      mustBeReadable?: boolean
      mustBeWritable?: boolean
    },
  ) {
    const result = this.systemService.validatePath(body.path, {
      mustExist: body.mustExist,
      mustBeDirectory: body.mustBeDirectory,
      mustBeFile: body.mustBeFile,
      mustBeReadable: body.mustBeReadable,
      mustBeWritable: body.mustBeWritable,
    })

    return {
      success: true,
      data: result,
    }
  }

  /**
   * 打开系统目录选择器
   * @param body - 请求体，包含 defaultPath（可选）
   * @returns 选择的目录路径
   */
  @Post('open-directory-picker')
  @ApiOperation({ summary: 'Open system directory picker' })
  @ApiResponse({ status: 200, description: 'Directory picker opened' })
  async openDirectoryPicker(@Body() body?: { defaultPath?: string }) {
    const result = await this.systemService.openDirectoryPicker(body?.defaultPath)
    return {
      success: result.success,
      data: result.path ? { path: result.path } : undefined,
      message: result.message,
    }
  }
}
