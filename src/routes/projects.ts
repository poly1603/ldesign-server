import { Router } from 'express'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { resolve, join } from 'path'
import { success, error } from '../utils/response'
import { db } from '../database'
import type { Project } from '../types'

export const projectsRouter = Router()

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: 获取项目列表
 *     description: 获取所有导入的项目列表，支持分页和关键词搜索
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: 每页数量
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 偏移量
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词（匹配项目名称或路径）
 *     responses:
 *       200:
 *         description: 成功获取项目列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 */
projectsRouter.get('/', (req, res) => {
  try {
    const { limit = 100, offset = 0, keyword } = req.query
    
    let sql = 'SELECT * FROM projects'
    const params: any[] = []
    
    if (keyword) {
      sql += ' WHERE name LIKE ? OR path LIKE ?'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    
    sql += ' ORDER BY updatedAt DESC LIMIT ? OFFSET ?'
    params.push(Number(limit), Number(offset))
    
    const projects = db.getDb().prepare(sql).all(...params) as any[]
    
    // 解析 JSON 字段
    const formatted = projects.map(p => ({
      ...p,
      config: p.config ? JSON.parse(p.config) : undefined,
    }))
    
    return success(res, formatted)
  } catch (err: any) {
    return error(res, err.message, 'QUERY_ERROR', 500)
  }
})

// 获取单个项目
projectsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as any

    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }

    // 读取 package.json 获取完整信息
    const packageJsonPath = join(project.path, 'package.json')
    let packageInfo: any = {}

    if (existsSync(packageJsonPath)) {
      try {
        const content = await readFile(packageJsonPath, 'utf-8')
        const packageJson = JSON.parse(content)
        packageInfo = {
          packageName: packageJson.name,
          version: packageJson.version,
          description: packageJson.description,
          author: packageJson.author,
          license: packageJson.license,
          contributors: packageJson.contributors,
          dependencies: packageJson.dependencies || {},
          devDependencies: packageJson.devDependencies || {},
          scripts: packageJson.scripts || {},
        }
      } catch (e) {
        // ignore
      }
    }

    return success(res, {
      ...project,
      ...packageInfo,
      config: project.config ? JSON.parse(project.config) : undefined,
    })
  } catch (err: any) {
    return error(res, err.message, 'QUERY_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/projects/import:
 *   post:
 *     summary: 导入项目
 *     description: 通过项目路径导入新项目
 *     tags: [Projects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *             properties:
 *               path:
 *                 type: string
 *                 description: 项目路径
 *                 example: /path/to/project
 *               detect:
 *                 type: boolean
 *                 default: true
 *                 description: 是否自动检测项目信息
 *     responses:
 *       200:
 *         description: 项目导入成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 项目路径不存在
 *       409:
 *         description: 项目已存在
 */
projectsRouter.post('/import', (req, res) => {
  try {
    const { path: projectPath, detect = true } = req.body
    
    if (!projectPath) {
      return error(res, '项目路径不能为空', 'INVALID_INPUT', 400)
    }
    
    const absPath = resolve(projectPath)
    
    if (!existsSync(absPath)) {
      return error(res, '项目路径不存在', 'PATH_NOT_FOUND', 404)
    }
    
    // 检查项目是否已存在
    const existing = db.getDb().prepare('SELECT * FROM projects WHERE path = ?').get(absPath)
    if (existing) {
      return error(res, '项目已存在', 'DUPLICATE', 409)
    }
    
    // 自动检测项目信息
    const name = absPath.split(/[\\/]/).pop() || 'Unknown'
    const now = Date.now()
    
    const project: Project = {
      id: randomUUID(),
      name,
      path: absPath,
      type: 'web',
      framework: detect ? detectFramework(absPath) : undefined,
      packageManager: detect ? detectPackageManager(absPath) : undefined,
      createdAt: now,
      updatedAt: now,
    }
    
    db.getDb().prepare(`
      INSERT INTO projects (id, name, path, type, framework, packageManager, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      project.id,
      project.name,
      project.path,
      project.type,
      project.framework,
      project.packageManager,
      project.createdAt,
      project.updatedAt
    )
    
    return success(res, project, '项目导入成功')
  } catch (err: any) {
    return error(res, err.message, 'IMPORT_ERROR', 500)
  }
})

// 创建项目
projectsRouter.post('/create', (req, res) => {
  try {
    const { name, path: projectPath, template, framework } = req.body
    
    if (!name || !projectPath) {
      return error(res, '项目名称和路径不能为空', 'INVALID_INPUT', 400)
    }
    
    const absPath = resolve(projectPath, name)
    
    if (existsSync(absPath)) {
      return error(res, '目标路径已存在', 'PATH_EXISTS', 409)
    }
    
    const now = Date.now()
    const project: Project = {
      id: randomUUID(),
      name,
      path: absPath,
      type: 'web',
      framework,
      createdAt: now,
      updatedAt: now,
    }
    
    // TODO: 实际创建项目文件
    
    db.getDb().prepare(`
      INSERT INTO projects (id, name, path, type, framework, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      project.id,
      project.name,
      project.path,
      project.type,
      project.framework,
      project.createdAt,
      project.updatedAt
    )
    
    return success(res, project, '项目创建成功')
  } catch (err: any) {
    return error(res, err.message, 'CREATE_ERROR', 500)
  }
})

// 更新项目
projectsRouter.put('/:id', (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id)
    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }
    
    const fields: string[] = []
    const values: any[] = []
    
    const allowedFields = ['name', 'description', 'framework', 'packageManager', 'config']
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = ?`)
        values.push(field === 'config' ? JSON.stringify(updates[field]) : updates[field])
      }
    }
    
    if (fields.length === 0) {
      return error(res, '没有可更新的字段', 'INVALID_INPUT', 400)
    }
    
    fields.push('updatedAt = ?')
    values.push(Date.now())
    values.push(id)
    
    db.getDb().prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    
    const updated = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
    
    return success(res, {
      ...updated,
      config: updated.config ? JSON.parse(updated.config) : undefined,
    })
  } catch (err: any) {
    return error(res, err.message, 'UPDATE_ERROR', 500)
  }
})

// 删除项目
projectsRouter.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    
    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id)
    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }
    
    db.getDb().prepare('DELETE FROM projects WHERE id = ?').run(id)
    
    return success(res, null, '项目删除成功')
  } catch (err: any) {
    return error(res, err.message, 'DELETE_ERROR', 500)
  }
})

// 打开项目
projectsRouter.post('/:id/open', (req, res) => {
  try {
    const { id } = req.params
    
    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id)
    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }
    
    // 更新最后打开时间
    db.getDb().prepare('UPDATE projects SET lastOpenedAt = ? WHERE id = ?').run(Date.now(), id)
    
    return success(res, null, '项目已打开')
  } catch (err: any) {
    return error(res, err.message, 'OPEN_ERROR', 500)
  }
})

// 获取项目统计
projectsRouter.get('/:id/stats', (req, res) => {
  try {
    const { id } = req.params

    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id)
    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }

    // TODO: 实现实际统计逻辑
    const stats = {
      files: 0,
      lines: 0,
      size: 0,
      dependencies: 0,
    }

    return success(res, stats)
  } catch (err: any) {
    return error(res, err.message, 'STATS_ERROR', 500)
  }
})

/**
 * @swagger
 * /api/projects/{id}/analyze:
 *   post:
 *     summary: 分析项目
 *     description: 分析项目的类型、框架、依赖等信息
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 项目 ID
 *     responses:
 *       200:
 *         description: 分析成功
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
 *                     type:
 *                       type: string
 *                       description: 项目类型
 *                       example: web
 *                     framework:
 *                       type: string
 *                       description: 框架名称
 *                       example: vue
 *                     packageManager:
 *                       type: string
 *                       description: 包管理器
 *                       example: pnpm
 *                     dependencies:
 *                       type: object
 *                       description: 生产依赖
 *                     devDependencies:
 *                       type: object
 *                       description: 开发依赖
 *                     scripts:
 *                       type: object
 *                       description: npm scripts
 *                     hasPackageJson:
 *                       type: boolean
 *                       description: 是否有 package.json
 *       404:
 *         description: 项目不存在
 */
projectsRouter.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params

    const project = db.getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as any
    if (!project) {
      return error(res, '项目不存在', 'NOT_FOUND', 404)
    }

    const projectPath = project.path

    // 检测项目类型
    const type = detectProjectType(projectPath)

    // 检测框架
    const framework = detectFramework(projectPath)

    // 检测包管理器
    const packageManager = detectPackageManager(projectPath)

    // 读取 package.json
    const packageJsonPath = join(projectPath, 'package.json')
    let packageJson: any = null
    let hasPackageJson = false

    if (existsSync(packageJsonPath)) {
      try {
        const content = await readFile(packageJsonPath, 'utf-8')
        packageJson = JSON.parse(content)
        hasPackageJson = true
      } catch (e) {
        // ignore
      }
    }

    const analysis = {
      type,
      framework,
      packageManager,
      dependencies: packageJson?.dependencies || {},
      devDependencies: packageJson?.devDependencies || {},
      scripts: packageJson?.scripts || {},
      hasPackageJson,
      name: packageJson?.name || project.name,
      version: packageJson?.version,
      description: packageJson?.description,
    }

    // 更新项目信息
    db.getDb().prepare(`
      UPDATE projects
      SET type = ?, framework = ?, packageManager = ?, updatedAt = ?
      WHERE id = ?
    `).run(type, framework, packageManager, Date.now(), id)

    return success(res, analysis, '项目分析成功')
  } catch (err: any) {
    return error(res, err.message, 'ANALYZE_ERROR', 500)
  }
})

// 辅助函数：检测项目类型
function detectProjectType(projectPath: string): string {
  try {
    const packageJsonPath = resolve(projectPath, 'package.json')
    if (existsSync(packageJsonPath)) {
      const packageJson = require(packageJsonPath)
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

      // 检测 @ldesign 包
      const hasBuilder = deps['@ldesign/builder']
      const hasLauncher = deps['@ldesign/launcher']

      if (hasBuilder && hasLauncher) {
        return 'library+project'
      }
      if (hasBuilder) {
        return 'library'
      }
      if (hasLauncher) {
        return 'project'
      }

      // 传统检测方式（向后兼容）
      // 检测是否为库项目
      if (packageJson.main || packageJson.module || packageJson.exports) {
        return 'library'
      }

      // 检测是否为 CLI 项目
      if (packageJson.bin) {
        return 'cli'
      }

      // 检测是否为 Web 项目
      if (deps.vue || deps.react || deps['@angular/core'] || deps.svelte || deps.next) {
        return 'web'
      }

      // 检测是否为 Node.js 项目
      if (deps.express || deps.koa || deps.fastify || deps.nestjs) {
        return 'node'
      }
    }
  } catch (e) {
    // ignore
  }
  return 'unknown'
}

// 辅助函数：检测框架
function detectFramework(projectPath: string): string | undefined {
  try {
    const packageJsonPath = resolve(projectPath, 'package.json')
    if (existsSync(packageJsonPath)) {
      const packageJson = require(packageJsonPath)
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

      // 优先检测元框架
      if (deps.next) return 'next'
      if (deps.nuxt) return 'nuxt'

      // 检测 Vue 版本
      if (deps.vue) {
        const vueVersion = deps.vue
        if (vueVersion.startsWith('^2') || vueVersion.startsWith('~2') || vueVersion.startsWith('2')) {
          return 'vue2'
        }
        if (vueVersion.startsWith('^3') || vueVersion.startsWith('~3') || vueVersion.startsWith('3')) {
          return 'vue3'
        }
        return 'vue'
      }

      // 其他框架
      if (deps.react) return 'react'
      if (deps['@angular/core']) return 'angular'
      if (deps.svelte) return 'svelte'
      if (deps.express) return 'express'
      if (deps.koa) return 'koa'
      if (deps.fastify) return 'fastify'
      if (deps['@nestjs/core']) return 'nestjs'
    }
  } catch (e) {
    // ignore
  }
  return undefined
}

// 辅助函数：检测包管理器
function detectPackageManager(projectPath: string): string | undefined {
  if (existsSync(resolve(projectPath, 'pnpm-lock.yaml'))) return 'pnpm'
  if (existsSync(resolve(projectPath, 'yarn.lock'))) return 'yarn'
  if (existsSync(resolve(projectPath, 'package-lock.json'))) return 'npm'
  if (existsSync(resolve(projectPath, 'bun.lockb'))) return 'bun'
  return undefined
}
