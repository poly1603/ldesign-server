import { Controller, Get, Post, Body } from '@nestjs/common'
import { SystemService } from './system.service'

/**
 * 系统工具控制器
 */
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  /**
   * 验证路径是否有效
   * @param body - 请求体，包含 path 和验证选项
   * @returns 验证结果
   */
  @Post('validate-path')
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
   * 获取目录选择器提示信息
   * @returns 目录选择器信息
   */
  @Get('directory-picker')
  getDirectoryPickerInfo() {
    const info = this.systemService.getDirectoryPickerInfo()
    return {
      success: true,
      data: info,
    }
  }
}

