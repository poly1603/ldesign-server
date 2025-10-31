import { Router } from 'express'
import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import { success, error } from '../utils/response'
import { db } from '../database'

export const projectTasksRouter = Router()

// 任务存储
const tasks = new Map<string, {
  id: string
  projectId: string
  type: 'dev' | 'build' | 'preview' | 'build-lib'
  status: 'pending' | 'running' | 'success' | 'failed'
  logs: string[]
  startTime?: number
  endTime?: number
  error?: string
  process?: any
}>()

/**
 * @swagger
 * /api/projects/{id}/dev:
 *   post:
 *     summary: 启动开发服务器
 *     description: 执行 npm run dev 启动项目开发服务器
 *     tags: [Project Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目 ID
 *     responses:
 *       200:
 *         description: 任务创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     taskId:
 *                       type: string
 *                       description: 任务 ID
 */
projectTasksRouter.post('/:id/dev', async (req, res) => {
  try {
    const { id } = req.params
    
    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }
    
    const taskId = randomUUID()
    const task = {
      id: taskId,
      projectId: id,
      type: 'dev' as const,
      status: 'pending' as const,
      logs: [],
      startTime: Date.now(),
    }
    
    tasks.set(taskId, task)
    
    // 异步执行任务
    executeTask(taskId, project.path, 'dev', project.packageManager || 'npm').catch(err => {
      const task = tasks.get(taskId)
      if (task) {
        task.status = 'failed'
        task.error = err.message
        task.endTime = Date.now()
      }
    })
    
    return success(res, { taskId }, '开发服务器启动中...')
  } catch (err: any) {
    return error(res, err.message, 'DEV_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/projects/{id}/build:
 *   post:
 *     summary: 执行项目打包
 *     description: 执行 npm run build 打包项目
 *     tags: [Project Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目 ID
 *     responses:
 *       200:
 *         description: 任务创建成功
 */
projectTasksRouter.post('/:id/build', async (req, res) => {
  try {
    const { id } = req.params
    
    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }
    
    const taskId = randomUUID()
    const task = {
      id: taskId,
      projectId: id,
      type: 'build' as const,
      status: 'pending' as const,
      logs: [],
      startTime: Date.now(),
    }
    
    tasks.set(taskId, task)
    
    executeTask(taskId, project.path, 'build', project.packageManager || 'npm').catch(err => {
      const task = tasks.get(taskId)
      if (task) {
        task.status = 'failed'
        task.error = err.message
        task.endTime = Date.now()
      }
    })
    
    return success(res, { taskId }, '项目打包中...')
  } catch (err: any) {
    return error(res, err.message, 'BUILD_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/projects/{id}/preview:
 *   post:
 *     summary: 预览打包结果
 *     description: 执行 npm run preview 预览打包后的项目
 *     tags: [Project Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目 ID
 *     responses:
 *       200:
 *         description: 任务创建成功
 */
projectTasksRouter.post('/:id/preview', async (req, res) => {
  try {
    const { id } = req.params
    
    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }
    
    const taskId = randomUUID()
    const task = {
      id: taskId,
      projectId: id,
      type: 'preview' as const,
      status: 'pending' as const,
      logs: [],
      startTime: Date.now(),
    }
    
    tasks.set(taskId, task)
    
    executeTask(taskId, project.path, 'preview', project.packageManager || 'npm').catch(err => {
      const task = tasks.get(taskId)
      if (task) {
        task.status = 'failed'
        task.error = err.message
        task.endTime = Date.now()
      }
    })
    
    return success(res, { taskId }, '预览启动中...')
  } catch (err: any) {
    return error(res, err.message, 'PREVIEW_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/projects/{id}/build-lib:
 *   post:
 *     summary: 执行库打包
 *     description: 执行库项目的打包命令
 *     tags: [Project Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目 ID
 *     responses:
 *       200:
 *         description: 任务创建成功
 */
projectTasksRouter.post('/:id/build-lib', async (req, res) => {
  try {
    const { id } = req.params
    
    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }
    
    // 检查是否为库项目
    if (project.type !== 'library' && project.type !== 'library+project') {
      return error(res, '该项目不是库项目', 'INVALID_PROJECT_TYPE', 400)
    }
    
    const taskId = randomUUID()
    const task = {
      id: taskId,
      projectId: id,
      type: 'build-lib' as const,
      status: 'pending' as const,
      logs: [],
      startTime: Date.now(),
    }
    
    tasks.set(taskId, task)
    
    executeTask(taskId, project.path, 'build:lib', project.packageManager || 'npm').catch(err => {
      const task = tasks.get(taskId)
      if (task) {
        task.status = 'failed'
        task.error = err.message
        task.endTime = Date.now()
      }
    })
    
    return success(res, { taskId }, '库打包中...')
  } catch (err: any) {
    return error(res, err.message, 'BUILD_LIB_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/projects/{id}/logs/{taskId}:
 *   get:
 *     summary: 获取任务日志
 *     description: 获取指定任务的执行日志和状态
 *     tags: [Project Tasks]
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
 */
projectTasksRouter.get('/:id/logs/:taskId', (req, res) => {
  try {
    const { taskId } = req.params
    
    const task = tasks.get(taskId)
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
    return error(res, err.message, 'QUERY_ERROR', 500)
  }
})

// 执行任务
async function executeTask(
  taskId: string,
  projectPath: string,
  script: string,
  packageManager: string
) {
  const task = tasks.get(taskId)
  if (!task) return
  
  task.status = 'running'
  
  const command = packageManager === 'npm' ? 'npm' : packageManager
  const args = packageManager === 'npm' ? ['run', script] : [script]
  
  const child = spawn(command, args, {
    cwd: projectPath,
    shell: true,
  })
  
  task.process = child
  
  child.stdout?.on('data', (data) => {
    const log = data.toString()
    task.logs.push(log)
  })
  
  child.stderr?.on('data', (data) => {
    const log = data.toString()
    task.logs.push(log)
  })
  
  child.on('close', (code) => {
    task.endTime = Date.now()
    if (code === 0) {
      task.status = 'success'
    } else {
      task.status = 'failed'
      task.error = `进程退出，代码: ${code}`
    }
  })
  
  child.on('error', (err) => {
    task.status = 'failed'
    task.error = err.message
    task.endTime = Date.now()
  })
}

