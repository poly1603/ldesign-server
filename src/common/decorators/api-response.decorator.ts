import { applyDecorators, Type } from '@nestjs/common'
import { ApiOkResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger'
import { ApiResponse } from '../dto/response.dto'

/**
 * API 响应装饰器
 * 用于 Swagger 文档生成，统一响应格式
 * 
 * @param dataDto - 数据 DTO 类
 * @param description - 响应描述
 * @returns 组合装饰器
 * 
 * @example
 * ```ts
 * @ApiStandardResponse(ProjectDto, '项目列表')
 * @Get()
 * findAll() {
 *   return this.projectService.findAll()
 * }
 * ```
 */
export function ApiStandardResponse<T>(
  dataDto?: Type<T>,
  description?: string,
) {
  const decorators = [
    ApiExtraModels(ApiResponse, ...(dataDto ? [dataDto] : [])),
    ApiOkResponse({
      description: description || '成功响应',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponse) },
          dataDto
            ? {
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  data: {
                    oneOf: [
                      { $ref: getSchemaPath(dataDto) },
                      {
                        type: 'array',
                        items: { $ref: getSchemaPath(dataDto) },
                      },
                    ],
                  },
                },
              }
            : {
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                },
              },
        ],
      },
    }),
  ]

  return applyDecorators(...decorators)
}
