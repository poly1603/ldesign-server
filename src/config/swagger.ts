/**
 * Swagger/OpenAPI 配置
 */

import swaggerJsdoc from 'swagger-jsdoc'
import type { Options } from 'swagger-jsdoc'

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LDesign Tools API',
      version: '1.0.0',
      description: `
# LDesign Tools API 文档

这是 LDesign Tools 的完整 API 文档。

## 功能模块

### 项目管理
- 项目导入、列表、详情
- 项目配置管理
- 项目分析

### 工具集成
- Builder - 构建工具
- Deployer - 部署工具
- Generator - 代码生成
- Formatter - 代码格式化
- Testing - 测试工具
- Monitor - 监控工具
- Performance - 性能分析
- Security - 安全扫描
- Git - Git 操作
- Deps - 依赖管理
- Changelog - 变更日志
- Docs Generator - 文档生成
- Publisher - 发布工具
- Translator - 国际化翻译

### 系统功能
- 文件管理
- 任务队列
- 日志查看
- 系统监控

## 认证

目前 API 不需要认证，后续版本将添加 JWT 认证。

## 响应格式

所有 API 响应遵循统一格式：

\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
\`\`\`

错误响应：

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息"
  }
}
\`\`\`
      `,
      contact: {
        name: 'LDesign Team',
        email: 'support@ldesign.dev',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发服务器',
      },
      {
        url: 'http://127.0.0.1:3000',
        description: '本地服务器',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: '健康检查',
      },
      {
        name: 'Projects',
        description: '项目管理',
      },
      {
        name: 'Tools',
        description: '工具管理',
      },
      {
        name: 'Builds',
        description: '构建管理',
      },
      {
        name: 'Deployments',
        description: '部署管理',
      },
      {
        name: 'Tests',
        description: '测试管理',
      },
      {
        name: 'Monitor',
        description: '监控',
      },
      {
        name: 'Logs',
        description: '日志',
      },
      {
        name: 'Tasks',
        description: '任务队列',
      },
      {
        name: 'Files',
        description: '文件管理',
      },
      {
        name: 'Dependencies',
        description: '依赖分析',
      },
      {
        name: 'Git',
        description: 'Git 操作',
      },
    ],
    components: {
      schemas: {
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            message: {
              type: 'string',
              example: '操作成功',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'ERROR_CODE',
                },
                message: {
                  type: 'string',
                  example: '错误信息',
                },
              },
            },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: '项目 ID',
            },
            name: {
              type: 'string',
              description: '项目名称',
            },
            path: {
              type: 'string',
              description: '项目路径',
            },
            type: {
              type: 'string',
              enum: ['node', 'web', 'mobile', 'desktop', 'library', 'other'],
              description: '项目类型',
            },
            framework: {
              type: 'string',
              description: '框架名称',
            },
            description: {
              type: 'string',
              description: '项目描述',
            },
            config: {
              type: 'object',
              description: '项目配置',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '创建时间',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新时间',
            },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/*.ts', // 扫描所有路由文件
  ],
}

export const swaggerSpec = swaggerJsdoc(options)

