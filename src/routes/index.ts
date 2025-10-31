import type { Express } from 'express'
import { healthRouter } from './health'
import { projectsRouter } from './projects'
import { projectTasksRouter } from './project-tasks'
import { toolsRouter } from './tools'
import { buildsRouter } from './builds'
import { deploymentsRouter } from './deployments'
import { testsRouter } from './tests'
import { monitorRouter } from './monitor'
import { logsRouter } from './logs'
import { tasksRouter } from './tasks'
import { filesRouter } from './files'
import { dependenciesRouter } from './dependencies'
import { gitRouter } from './git'
import { swaggerRouter } from './swagger'
import { builderRouter } from './builder'
import { nodeManagerRouter } from './node-manager'
import npmRegistryRouter from './npm-registry.js'

export function setupRoutes(app: Express) {
  // API 文档（根路径）
  app.use('/api-docs', swaggerRouter)

  // 健康检查
  app.use('/api/health', healthRouter)

  // 项目管理
  app.use('/api/projects', projectsRouter)

  // 项目任务（dev/build/preview 等）
  app.use('/api/projects', projectTasksRouter)

  // Builder 工具（项目级别）
  app.use('/api/projects', builderRouter)

  // 工具管理
  app.use('/api/tools', toolsRouter)

  // 构建管理
  app.use('/api/builds', buildsRouter)

  // 部署管理
  app.use('/api/deployments', deploymentsRouter)

  // 测试管理
  app.use('/api/tests', testsRouter)

  // 监控
  app.use('/api/monitor', monitorRouter)

  // 日志
  app.use('/api/logs', logsRouter)

  // 任务队列
  app.use('/api/tasks', tasksRouter)

  // 文件管理
  app.use('/api/files', filesRouter)

  // 依赖分析
  app.use('/api/dependencies', dependenciesRouter)

  // Git操作
  app.use('/api/git', gitRouter)

  // Node 版本管理
  app.use('/api/node-manager', nodeManagerRouter)

  // NPM 私有仓库
  app.use('/api/npm-registry', npmRegistryRouter)
}
