import { Router } from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import { success, error } from '../utils/response'

const execAsync = promisify(exec)

export const nodeManagerRouter = Router()

/**
 * @swagger
 * /api/node-manager/tools:
 *   get:
 *     summary: 获取已安装的 Node 版本管理工具
 *     description: 检测系统中已安装的 Node 版本管理工具（nvm, fnm, volta 等）
 *     tags: [Node Manager]
 *     responses:
 *       200:
 *         description: 成功获取工具列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: nvm
 *                       version:
 *                         type: string
 *                         example: 0.39.0
 *                       installed:
 *                         type: boolean
 *                       path:
 *                         type: string
 */
nodeManagerRouter.get('/tools', async (req, res) => {
  try {
    const tools = await detectVersionManagers()
    return success(res, tools)
  } catch (err: any) {
    return error(res, err.message, 'DETECTION_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/node-manager/versions:
 *   get:
 *     summary: 获取已安装的 Node 版本列表
 *     description: 获取通过版本管理工具安装的所有 Node 版本
 *     tags: [Node Manager]
 *     parameters:
 *       - in: query
 *         name: tool
 *         schema:
 *           type: string
 *           enum: [nvm, fnm, volta]
 *         description: 版本管理工具名称
 *     responses:
 *       200:
 *         description: 成功获取版本列表
 */
nodeManagerRouter.get('/versions', async (req, res) => {
  try {
    const { tool = 'nvm' } = req.query
    const versions = await getInstalledVersions(tool as string)
    return success(res, versions)
  } catch (err: any) {
    return error(res, err.message, 'QUERY_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/node-manager/versions/available:
 *   get:
 *     summary: 获取可安装的 Node 版本列表
 *     description: 获取远程可用的 Node 版本列表
 *     tags: [Node Manager]
 *     parameters:
 *       - in: query
 *         name: tool
 *         schema:
 *           type: string
 *           enum: [nvm, fnm, volta]
 *         description: 版本管理工具名称
 *     responses:
 *       200:
 *         description: 成功获取可用版本列表
 */
nodeManagerRouter.get('/versions/available', async (req, res) => {
  try {
    const { tool = 'nvm' } = req.query
    const versions = await getAvailableVersions(tool as string)
    return success(res, versions)
  } catch (err: any) {
    return error(res, err.message, 'QUERY_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/node-manager/versions/current:
 *   get:
 *     summary: 获取当前使用的 Node 版本
 *     description: 获取当前激活的 Node 版本信息
 *     tags: [Node Manager]
 *     responses:
 *       200:
 *         description: 成功获取当前版本
 */
nodeManagerRouter.get('/versions/current', async (req, res) => {
  try {
    const version = await getCurrentVersion()
    return success(res, version)
  } catch (err: any) {
    return error(res, err.message, 'QUERY_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/node-manager/versions/install:
 *   post:
 *     summary: 安装指定的 Node 版本
 *     description: 使用版本管理工具安装指定版本的 Node.js
 *     tags: [Node Manager]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - version
 *             properties:
 *               version:
 *                 type: string
 *                 example: 18.17.0
 *               tool:
 *                 type: string
 *                 enum: [nvm, fnm, volta]
 *                 default: nvm
 *     responses:
 *       200:
 *         description: 安装成功
 */
nodeManagerRouter.post('/versions/install', async (req, res) => {
  try {
    const { version, tool = 'nvm' } = req.body
    
    if (!version) {
      return error(res, '版本号不能为空', 'INVALID_PARAMS', 400)
    }
    
    await installVersion(tool, version)
    return success(res, null, `Node.js ${version} 安装成功`)
  } catch (err: any) {
    return error(res, err.message, 'INSTALL_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/node-manager/versions/uninstall:
 *   post:
 *     summary: 卸载指定的 Node 版本
 *     description: 使用版本管理工具卸载指定版本的 Node.js
 *     tags: [Node Manager]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - version
 *             properties:
 *               version:
 *                 type: string
 *                 example: 18.17.0
 *               tool:
 *                 type: string
 *                 enum: [nvm, fnm, volta]
 *                 default: nvm
 *     responses:
 *       200:
 *         description: 卸载成功
 */
nodeManagerRouter.post('/versions/uninstall', async (req, res) => {
  try {
    const { version, tool = 'nvm' } = req.body
    
    if (!version) {
      return error(res, '版本号不能为空', 'INVALID_PARAMS', 400)
    }
    
    await uninstallVersion(tool, version)
    return success(res, null, `Node.js ${version} 卸载成功`)
  } catch (err: any) {
    return error(res, err.message, 'UNINSTALL_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/node-manager/versions/use:
 *   post:
 *     summary: 切换到指定的 Node 版本
 *     description: 使用版本管理工具切换到指定版本的 Node.js
 *     tags: [Node Manager]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - version
 *             properties:
 *               version:
 *                 type: string
 *                 example: 18.17.0
 *               tool:
 *                 type: string
 *                 enum: [nvm, fnm, volta]
 *                 default: nvm
 *     responses:
 *       200:
 *         description: 切换成功
 */
nodeManagerRouter.post('/versions/use', async (req, res) => {
  try {
    const { version, tool = 'nvm' } = req.body
    
    if (!version) {
      return error(res, '版本号不能为空', 'INVALID_PARAMS', 400)
    }
    
    await useVersion(tool, version)
    return success(res, null, `已切换到 Node.js ${version}`)
  } catch (err: any) {
    return error(res, err.message, 'SWITCH_ERROR', 500)
  }
})

// 辅助函数：检测版本管理工具
async function detectVersionManagers() {
  const tools = [
    { name: 'nvm', command: 'nvm --version' },
    { name: 'fnm', command: 'fnm --version' },
    { name: 'volta', command: 'volta --version' },
  ]
  
  const results = await Promise.all(
    tools.map(async (tool) => {
      try {
        const { stdout } = await execAsync(tool.command)
        return {
          name: tool.name,
          version: stdout.trim(),
          installed: true,
        }
      } catch {
        return {
          name: tool.name,
          version: null,
          installed: false,
        }
      }
    })
  )
  
  return results
}

// 辅助函数：获取已安装的版本
async function getInstalledVersions(tool: string) {
  const commands: Record<string, string> = {
    nvm: 'nvm list',
    fnm: 'fnm list',
    volta: 'volta list node',
  }
  
  const command = commands[tool]
  if (!command) {
    throw new Error(`不支持的工具: ${tool}`)
  }
  
  try {
    const { stdout } = await execAsync(command)
    return parseVersionList(stdout, tool)
  } catch (err: any) {
    throw new Error(`获取版本列表失败: ${err.message}`)
  }
}

// 辅助函数：获取可用版本
async function getAvailableVersions(tool: string) {
  const commands: Record<string, string> = {
    nvm: 'nvm list available',
    fnm: 'fnm list-remote',
    volta: 'volta list node --all',
  }
  
  const command = commands[tool]
  if (!command) {
    throw new Error(`不支持的工具: ${tool}`)
  }
  
  try {
    const { stdout } = await execAsync(command)
    return parseVersionList(stdout, tool)
  } catch (err: any) {
    throw new Error(`获取可用版本失败: ${err.message}`)
  }
}

// 辅助函数：获取当前版本
async function getCurrentVersion() {
  try {
    const { stdout } = await execAsync('node --version')
    return {
      version: stdout.trim().replace('v', ''),
      path: process.execPath,
    }
  } catch (err: any) {
    throw new Error(`获取当前版本失败: ${err.message}`)
  }
}

// 辅助函数：安装版本
async function installVersion(tool: string, version: string) {
  const commands: Record<string, string> = {
    nvm: `nvm install ${version}`,
    fnm: `fnm install ${version}`,
    volta: `volta install node@${version}`,
  }
  
  const command = commands[tool]
  if (!command) {
    throw new Error(`不支持的工具: ${tool}`)
  }
  
  try {
    await execAsync(command)
  } catch (err: any) {
    throw new Error(`安装失败: ${err.message}`)
  }
}

// 辅助函数：卸载版本
async function uninstallVersion(tool: string, version: string) {
  const commands: Record<string, string> = {
    nvm: `nvm uninstall ${version}`,
    fnm: `fnm uninstall ${version}`,
    volta: `volta uninstall node@${version}`,
  }
  
  const command = commands[tool]
  if (!command) {
    throw new Error(`不支持的工具: ${tool}`)
  }
  
  try {
    await execAsync(command)
  } catch (err: any) {
    throw new Error(`卸载失败: ${err.message}`)
  }
}

// 辅助函数：切换版本
async function useVersion(tool: string, version: string) {
  const commands: Record<string, string> = {
    nvm: `nvm use ${version}`,
    fnm: `fnm use ${version}`,
    volta: `volta pin node@${version}`,
  }
  
  const command = commands[tool]
  if (!command) {
    throw new Error(`不支持的工具: ${tool}`)
  }
  
  try {
    await execAsync(command)
  } catch (err: any) {
    throw new Error(`切换失败: ${err.message}`)
  }
}

// 辅助函数：解析版本列表
function parseVersionList(output: string, tool: string): string[] {
  // 简化实现，实际应该根据不同工具的输出格式进行解析
  const lines = output.split('\n').filter(line => line.trim())
  const versions: string[] = []
  
  for (const line of lines) {
    const match = line.match(/v?(\d+\.\d+\.\d+)/)
    if (match) {
      versions.push(match[1])
    }
  }
  
  return versions
}

