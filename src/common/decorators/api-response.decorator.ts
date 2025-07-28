import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse, ApiResponseOptions } from '@nestjs/swagger';
import { ResponseDto, ErrorResponseDto, ValidationErrorResponseDto } from '../dto';

export const ApiSuccessResponse = <TModel extends Type<any>>(
  model?: TModel,
  options?: Omit<ApiResponseOptions, 'type'>,
) => {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: '操作成功',
      type: model ? ResponseDto : undefined,
      ...options,
    }),
  );
};

export const ApiCreatedResponse = <TModel extends Type<any>>(
  model?: TModel,
  options?: Omit<ApiResponseOptions, 'type'>,
) => {
  return applyDecorators(
    ApiResponse({
      status: 201,
      description: '创建成功',
      type: model ? ResponseDto : undefined,
      ...options,
    }),
  );
};

export const ApiErrorResponses = () => {
  return applyDecorators(
    ApiResponse({
      status: 400,
      description: '请求参数错误',
      type: ValidationErrorResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: '未授权',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: 403,
      description: '禁止访问',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: '资源不存在',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: 500,
      description: '服务器内部错误',
      type: ErrorResponseDto,
    }),
  );
};

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  options?: Omit<ApiResponseOptions, 'type'>,
) => {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: '分页查询成功',
      schema: {
        allOf: [
          { $ref: '#/components/schemas/ResponseDto' },
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: `#/components/schemas/${model.name}` },
                  },
                  total: { type: 'number' },
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  totalPages: { type: 'number' },
                  hasNext: { type: 'boolean' },
                  hasPrev: { type: 'boolean' },
                },
              },
            },
          },
        ],
      },
      ...options,
    }),
  );
};

export const ApiResponseDecorator = <TModel extends Type<any>>(
  model?: TModel,
  options?: Omit<ApiResponseOptions, 'type'>,
) => {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: '操作成功',
      type: model,
      ...options,
    }),
    ApiErrorResponses(),
  );
};