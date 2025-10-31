import { Router } from 'express'
import { readdir, readFile, writeFile, mkdir, unlink, stat } from 'fs/promises'
import { join, dirname, relative, sep, resolve } from 'path'
import { existsSync } from 'fs'
import { success, error } from '../utils/response'

export const filesRouter = Router()

/**
 * @swagger
 * /api/files/select-directory:
 *   post:
 *     summary: 选择目录
 *     description: 验证并返回用户输入的目录路径（手动输入方案）
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               path:
 *                 type: string
 *                 description: 目录路径
 *                 example: /path/to/directory
 *               title:
 *                 type: string
 *                 description: 对话框标题（保留字段，用于未来扩展）
 *                 example: 选择项目目录
 *     responses:
 *       200:
 *         description: 目录验证成功
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
 *                     path:
 *                       type: string
 *                       description: 验证后的绝对路径
 *                     exists:
 *                       type: boolean
 *                       description: 路径是否存在
 *                     isDirectory:
 *                       type: boolean
 *                       description: 是否为目录
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 路径不存在或不是目录
 */
filesRouter.post('/select-directory', async (req, res) => {
  try {
    const { path: inputPath, title } = req.body

    if (!inputPath) {
      return error(res, '路径不能为空', 'INVALID_INPUT', 400)
    }

    // 解析为绝对路径
    const absPath = resolve(inputPath)

    // 检查路径是否存在
    if (!existsSync(absPath)) {
      return error(res, '路径不存在', 'PATH_NOT_FOUND', 404)
    }

    // 检查是否为目录
    const stats = await stat(absPath)
    if (!stats.isDirectory()) {
      return error(res, '路径不是目录', 'NOT_DIRECTORY', 400)
    }

    return success(res, {
      path: absPath,
      exists: true,
      isDirectory: true,
    }, '目录验证成功')
  } catch (err: any) {
    return error(res, err.message, 'VALIDATION_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/files/tree:
 *   get:
 *     summary: 获取文件树
 *     description: 获取指定路径的文件树结构
 *     tags: [Files]
 *     parameters:
 *       - in: query
 *         name: path
 *         required: true
 *         schema:
 *           type: string
 *         description: 目标路径
 *       - in: query
 *         name: depth
 *         schema:
 *           type: integer
 *           default: 2
 *         description: 遍历深度
 *     responses:
 *       200:
 *         description: 成功获取文件树
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 路径不存在
 */
filesRouter.get('/tree', async (req, res) => {
  try {
    const { path: targetPath, depth = 2 } = req.query
    
    if (!targetPath) {
      return error(res, '路径不能为空', 'INVALID_INPUT', 400)
    }
    
    const absPath = targetPath as string
    
    if (!existsSync(absPath)) {
      return error(res, '路径不存在', 'PATH_NOT_FOUND', 404)
    }
    
    const tree = await buildFileTree(absPath, Number(depth))
    return success(res, tree)
  } catch (err: any) {
    return error(res, err.message, 'READ_ERROR', 500)
  }
})

// 读取文件内容
filesRouter.get('/read', async (req, res) => {
  try {
    const { path: filePath } = req.query
    
    if (!filePath) {
      return error(res, '文件路径不能为空', 'INVALID_INPUT', 400)
    }
    
    const absPath = filePath as string
    
    if (!existsSync(absPath)) {
      return error(res, '文件不存在', 'FILE_NOT_FOUND', 404)
    }
    
    const stats = await stat(absPath)
    if (stats.isDirectory()) {
      return error(res, '路径是目录，不是文件', 'INVALID_TYPE', 400)
    }
    
    // 限制文件大小（5MB）
    if (stats.size > 5 * 1024 * 1024) {
      return error(res, '文件太大，无法读取', 'FILE_TOO_LARGE', 400)
    }
    
    const content = await readFile(absPath, 'utf-8')
    return success(res, { content, size: stats.size })
  } catch (err: any) {
    return error(res, err.message, 'READ_ERROR', 500)
  }
})

// 写入文件
filesRouter.post('/write', async (req, res) => {
  try {
    const { path: filePath, content } = req.body
    
    if (!filePath || content === undefined) {
      return error(res, '文件路径和内容不能为空', 'INVALID_INPUT', 400)
    }
    
    await writeFile(filePath, content, 'utf-8')
    return success(res, null, '文件保存成功')
  } catch (err: any) {
    return error(res, err.message, 'WRITE_ERROR', 500)
  }
})

// 创建文件或目录
filesRouter.post('/create', async (req, res) => {
  try {
    const { path: targetPath, type = 'file', content = '' } = req.body
    
    if (!targetPath) {
      return error(res, '路径不能为空', 'INVALID_INPUT', 400)
    }
    
    if (existsSync(targetPath)) {
      return error(res, '路径已存在', 'PATH_EXISTS', 409)
    }
    
    if (type === 'directory') {
      await mkdir(targetPath, { recursive: true })
    } else {
      const dir = dirname(targetPath)
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true })
      }
      await writeFile(targetPath, content, 'utf-8')
    }
    
    return success(res, null, `${type === 'directory' ? '目录' : '文件'}创建成功`)
  } catch (err: any) {
    return error(res, err.message, 'CREATE_ERROR', 500)
  }
})

// 删除文件或目录
filesRouter.delete('/delete', async (req, res) => {
  try {
    const { path: targetPath } = req.query
    
    if (!targetPath) {
      return error(res, '路径不能为空', 'INVALID_INPUT', 400)
    }
    
    const absPath = targetPath as string
    
    if (!existsSync(absPath)) {
      return error(res, '路径不存在', 'PATH_NOT_FOUND', 404)
    }
    
    await unlink(absPath)
    return success(res, null, '删除成功')
  } catch (err: any) {
    return error(res, err.message, 'DELETE_ERROR', 500)
  }
})

// 辅助函数：构建文件树
async function buildFileTree(rootPath: string, maxDepth: number, currentDepth = 0): Promise<any> {
  const stats = await stat(rootPath)
  const name = rootPath.split(sep).pop() || rootPath
  
  const node: any = {
    name,
    path: rootPath,
    type: stats.isDirectory() ? 'directory' : 'file',
    size: stats.size,
    modifiedAt: stats.mtimeMs,
  }
  
  if (stats.isDirectory() && currentDepth < maxDepth) {
    const entries = await readdir(rootPath)
    const children = []
    
    for (const entry of entries) {
      // 跳过常见的忽略目录
      if (['.git', 'node_modules', '.next', 'dist', 'build', '.vscode'].includes(entry)) {
        continue
      }
      
      const childPath = join(rootPath, entry)
      try {
        const child = await buildFileTree(childPath, maxDepth, currentDepth + 1)
        children.push(child)
      } catch (err) {
        // 忽略无法访问的文件/目录
      }
    }
    
    node.children = children
  }
  
  return node
}
