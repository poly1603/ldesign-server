import { Router } from 'express'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { success, error } from '../utils/response'
import { db } from '../database'

export const builderRouter = Router()

// 任务存储（简化版，实际应该用数据库）
const buildTasks = new Map<string, {
  id: string
  projectId: string
  status: 'pending' | 'running' | 'success' | 'failed'
  logs: string[]
  startTime?: number
  endTime?: number
  error?: string
}>()

/**
 * @swagger
 * /api/projects/{id}/builder/config:
 *   get:
 *     summary: 获取构建配置
 *     description: 获取项目的构建配置信息
 *     tags: [Builder]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目 ID
 *     responses:
 *       200:
 *         description: 成功获取构建配置
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     mode:
 *                       type: string
 *                       example: development
 *                     outDir:
 *                       type: string
 *                       example: dist
 *                     sourcemap:
 *                       type: boolean
 *                       example: true
 *                     minify:
 *                       type: boolean
 *                       example: false
 *       404:
 *         description: 项目不存在
 */
builderRouter.get('/:id/config', async (req, res) => {
  try {
    const { id } = req.params
    
    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }
    
    // 读取构建配置文件
    const configPath = join(project.path, 'ldesign.builder.config.js')
    let config: any = {
      mode: 'development',
      outDir: 'dist',
      sourcemap: true,
      minify: false,
    }
    
    if (existsSync(configPath)) {
      try {
        const content = await readFile(configPath, 'utf-8')
        // 简化处理，实际应该用更安全的方式解析配置
        config = JSON.parse(content)
      } catch (e) {
        // 使用默认配置
      }
    }
    
    return success(res, config)
  } catch (err: any) {
    return error(res, err.message, 'CONFIG_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/projects/{id}/builder/config:
 *   put:
 *     summary: 更新构建配置
 *     description: 更新项目的构建配置
 *     tags: [Builder]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [development, production]
 *               outDir:
 *                 type: string
 *               sourcemap:
 *                 type: boolean
 *               minify:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 配置更新成功
 *       404:
 *         description: 项目不存在
 */
builderRouter.put('/:id/config', async (req, res) => {
  try {
    const { id } = req.params
    const config = req.body
    
    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }
    
    // 保存配置文件
    const configPath = join(project.path, 'ldesign.builder.config.json')
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
    
    return success(res, config, '配置更新成功')
  } catch (err: any) {
    return error(res, err.message, 'UPDATE_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/projects/{id}/builder/build:
 *   post:
 *     summary: 执行构建
 *     description: 执行项目构建任务
 *     tags: [Builder]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目 ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [development, production]
 *                 default: development
 *               watch:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: 构建任务已创建
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     taskId:
 *                       type: string
 *                       description: 任务 ID
 *       404:
 *         description: 项目不存在
 */
builderRouter.post('/:id/build', async (req, res) => {
  try {
    const { id } = req.params
    const { mode = 'development', watch = false } = req.body
    
    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }
    
    // 创建构建任务
    const taskId = randomUUID()
    const task = {
      id: taskId,
      projectId: id,
      status: 'pending' as const,
      logs: [],
      startTime: Date.now(),
    }
    
    buildTasks.set(taskId, task)
    
    // 异步执行构建（简化版）
    executeBuild(taskId, project.path, mode, watch).catch(err => {
      const task = buildTasks.get(taskId)
      if (task) {
        task.status = 'failed'
        task.error = err.message
        task.endTime = Date.now()
      }
    })
    
    return success(res, { taskId }, '构建任务已创建')
  } catch (err: any) {
    return error(res, err.message, 'BUILD_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/projects/{id}/builder/logs/{taskId}:
 *   get:
 *     summary: 获取构建日志
 *     description: 获取指定构建任务的日志和状态
 *     tags: [Builder]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目 ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: 任务 ID
 *     responses:
 *       200:
 *         description: 成功获取日志
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     taskId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, running, success, failed]
 *                     logs:
 *                       type: array
 *                       items:
 *                         type: string
 *                     startTime:
 *                       type: number
 *                     endTime:
 *                       type: number
 *                     error:
 *                       type: string
 *       404:
 *         description: 任务不存在
 */
builderRouter.get('/:id/logs/:taskId', (req, res) => {
  try {
    const { taskId } = req.params
    
    const task = buildTasks.get(taskId)
    if (!task) {
      return error(res, '任务不存在', 'NOT_FOUND', 404)
    }
    
    return success(res, {
      taskId: task.id,
      status: task.status,
      logs: task.logs,
      startTime: task.startTime,
      endTime: task.endTime,
      error: task.error,
    })
  } catch (err: any) {
    return error(res, err.message, 'LOGS_ERROR', 500)
  }
})

// 辅助函数：执行构建
async function executeBuild(taskId: string, projectPath: string, mode: string, watch: boolean) {
  const task = buildTasks.get(taskId)
  if (!task) return
  
  task.status = 'running'
  task.logs.push(`[${new Date().toISOString()}] 开始构建...`)
  task.logs.push(`[${new Date().toISOString()}] 模式: ${mode}`)
  task.logs.push(`[${new Date().toISOString()}] 监听: ${watch}`)
  
  // 模拟构建过程
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  task.logs.push(`[${new Date().toISOString()}] 正在编译...`)
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  task.logs.push(`[${new Date().toISOString()}] 正在打包...`)
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  task.logs.push(`[${new Date().toISOString()}] 构建完成！`)
  task.status = 'success'
  task.endTime = Date.now()
}

