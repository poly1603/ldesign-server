import { Router } from 'express'
import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import yaml from 'js-yaml'

const execAsync = promisify(exec)
const npmRegistryRouter = Router()

// Verdaccio 进程管理
let verdaccioProcess: any = null
let verdaccioLogs: string[] = []

/**
 * @swagger
 * /api/npm-registry/status:
 *   get:
 *     summary: 获取 Verdaccio 服务状态
 *     description: 检查 Verdaccio 服务是否正在运行
 *     tags: [NPM Registry]
 *     responses:
 *       200:
 *         description: 服务状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 running:
 *                   type: boolean
 *                   description: 是否正在运行
 *                 pid:
 *                   type: number
 *                   description: 进程 ID
 *                 uptime:
 *                   type: number
 *                   description: 运行时长（秒）
 *                 url:
 *                   type: string
 *                   description: 服务地址
 */
npmRegistryRouter.get('/status', async (req, res) => {
  try {
    const running = verdaccioProcess !== null && !verdaccioProcess.killed
    
    res.json({
      running,
      pid: running ? verdaccioProcess.pid : null,
      uptime: running ? Math.floor((Date.now() - verdaccioProcess.startTime) / 1000) : 0,
      url: 'http://localhost:4873',
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/npm-registry/start:
 *   post:
 *     summary: 启动 Verdaccio 服务
 *     description: 启动 Verdaccio NPM 私有仓库服务
 *     tags: [NPM Registry]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               port:
 *                 type: number
 *                 description: 端口号
 *                 default: 4873
 *               configPath:
 *                 type: string
 *                 description: 配置文件路径
 *     responses:
 *       200:
 *         description: 启动成功
 *       400:
 *         description: 服务已在运行
 *       500:
 *         description: 启动失败
 */
npmRegistryRouter.post('/start', async (req, res) => {
  try {
    if (verdaccioProcess && !verdaccioProcess.killed) {
      return res.status(400).json({ error: '服务已在运行' })
    }

    const { port = 4873, configPath } = req.body

    // 检查 Verdaccio 是否已安装
    try {
      await execAsync('verdaccio --version')
    } catch {
      return res.status(400).json({ 
        error: 'Verdaccio 未安装，请先运行: npm install -g verdaccio' 
      })
    }

    // 启动 Verdaccio
    const args = ['--listen', `${port}`]
    if (configPath) {
      args.push('--config', configPath)
    }

    verdaccioProcess = spawn('verdaccio', args, {
      shell: true,
    })

    verdaccioProcess.startTime = Date.now()
    verdaccioLogs = []

    verdaccioProcess.stdout?.on('data', (data: Buffer) => {
      const log = data.toString()
      verdaccioLogs.push(log)
      if (verdaccioLogs.length > 1000) {
        verdaccioLogs.shift()
      }
    })

    verdaccioProcess.stderr?.on('data', (data: Buffer) => {
      const log = data.toString()
      verdaccioLogs.push(log)
      if (verdaccioLogs.length > 1000) {
        verdaccioLogs.shift()
      }
    })

    verdaccioProcess.on('close', (code: number) => {
      verdaccioLogs.push(`进程退出，代码: ${code}`)
      verdaccioProcess = null
    })

    // 等待服务启动
    await new Promise(resolve => setTimeout(resolve, 2000))

    res.json({ 
      message: '服务启动成功',
      pid: verdaccioProcess.pid,
      url: `http://localhost:${port}`,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/npm-registry/stop:
 *   post:
 *     summary: 停止 Verdaccio 服务
 *     description: 停止正在运行的 Verdaccio 服务
 *     tags: [NPM Registry]
 *     responses:
 *       200:
 *         description: 停止成功
 *       400:
 *         description: 服务未运行
 */
npmRegistryRouter.post('/stop', async (req, res) => {
  try {
    if (!verdaccioProcess || verdaccioProcess.killed) {
      return res.status(400).json({ error: '服务未运行' })
    }

    verdaccioProcess.kill()
    verdaccioProcess = null

    res.json({ message: '服务已停止' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/npm-registry/logs:
 *   get:
 *     summary: 获取服务日志
 *     description: 获取 Verdaccio 服务的运行日志
 *     tags: [NPM Registry]
 *     responses:
 *       200:
 *         description: 日志内容
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: string
 */
npmRegistryRouter.get('/logs', async (req, res) => {
  try {
    res.json({ logs: verdaccioLogs })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/npm-registry/config:
 *   get:
 *     summary: 获取配置
 *     description: 获取 Verdaccio 配置文件内容
 *     tags: [NPM Registry]
 *     responses:
 *       200:
 *         description: 配置内容
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 config:
 *                   type: object
 *                   description: 配置对象
 *                 path:
 *                   type: string
 *                   description: 配置文件路径
 */
npmRegistryRouter.get('/config', async (req, res) => {
  try {
    const configPath = join(homedir(), '.config', 'verdaccio', 'config.yaml')
    
    if (!existsSync(configPath)) {
      return res.status(404).json({ error: '配置文件不存在' })
    }

    const configContent = readFileSync(configPath, 'utf-8')
    const config = yaml.load(configContent)

    res.json({
      config,
      path: configPath,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/npm-registry/config:
 *   put:
 *     summary: 更新配置
 *     description: 更新 Verdaccio 配置文件
 *     tags: [NPM Registry]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               config:
 *                 type: object
 *                 description: 配置对象
 *     responses:
 *       200:
 *         description: 更新成功
 *       500:
 *         description: 更新失败
 */
npmRegistryRouter.put('/config', async (req, res) => {
  try {
    const { config } = req.body
    const configPath = join(homedir(), '.config', 'verdaccio', 'config.yaml')

    const yamlContent = yaml.dump(config)
    writeFileSync(configPath, yamlContent, 'utf-8')

    res.json({ message: '配置已更新' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

/**
 * @swagger
 * /api/npm-registry/packages:
 *   get:
 *     summary: 获取包列表
 *     description: 获取私有仓库中的包列表
 *     tags: [NPM Registry]
 *     responses:
 *       200:
 *         description: 包列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 packages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       version:
 *                         type: string
 *                       description:
 *                         type: string
 */
npmRegistryRouter.get('/packages', async (req, res) => {
  try {
    // 从 Verdaccio API 获取包列表
    const response = await fetch('http://localhost:4873/-/verdaccio/packages')
    const packages = await response.json()

    res.json({ packages })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default npmRegistryRouter

