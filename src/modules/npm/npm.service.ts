import { Injectable, Logger, NotFoundException, Inject, Optional, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { exec, spawn, ChildProcess } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import { join, resolve as pathResolve, normalize } from 'path'
import { homedir } from 'os'
import * as yaml from 'js-yaml'
import { NpmRegistry } from './entities/npm-registry.entity.js'
import { CreateNpmRegistryDto, UpdateNpmRegistryDto, NpmLoginDto, NpmPackageInfoDto } from './dto/npm.dto.js'
import { WebSocketEventsService } from '../../common/websocket/services/websocket-events.service.js'

const execAsync = promisify(exec)

// Verdaccio 进程管理
interface VerdaccioProcess {
  process: ChildProcess | null // 改为可空，因为独立进程可能没有 process 引用
  pid: number | null
  port: number
  configPath: string
  storagePath: string
  startedAt: Date
  isDetached: boolean // 标记是否为独立进程
}

@Injectable()
export class NpmService implements OnModuleInit {
  private readonly logger = new Logger(NpmService.name)
  private verdaccioProcess: VerdaccioProcess | null = null
  private readonly DEFAULT_VERDACCIO_PORT = 4873
  private readonly VERDACCIO_STORAGE_PATH = join(homedir(), '.ldesign', 'verdaccio', 'storage')
  private readonly VERDACCIO_CONFIG_PATH = join(homedir(), '.ldesign', 'verdaccio', 'config.yaml')
  private readonly VERDACCIO_PID_DIR = join(homedir(), '.ldesign', 'verdaccio')
  private readonly VERDACCIO_PID_FILE = join(this.VERDACCIO_PID_DIR, 'verdaccio.pid')

  constructor(
    @InjectRepository(NpmRegistry)
    private readonly npmRegistryRepository: Repository<NpmRegistry>,
    @Optional()
    @Inject(WebSocketEventsService)
    private readonly wsEventsService?: WebSocketEventsService,
  ) {}

  /**
   * 模块初始化时恢复已运行的 Verdaccio 进程
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.restoreVerdaccioProcess()
    } catch (error: any) {
      this.logger.warn(`[Verdaccio] 恢复进程失败: ${error.message}`)
    }
  }

  /**
   * 恢复已运行的 Verdaccio 进程
   */
  private async restoreVerdaccioProcess(): Promise<void> {
    try {
      // 检查 PID 文件是否存在
      let pid: number | null = null
      let port: number | null = null
      
      try {
        const pidContent = await fs.readFile(this.VERDACCIO_PID_FILE, 'utf-8')
        const pidData = JSON.parse(pidContent.trim())
        pid = pidData.pid
        port = pidData.port
        this.logger.debug(`[Verdaccio] 从 PID 文件读取: PID=${pid}, Port=${port}`)
      } catch {
        // PID 文件不存在或格式错误，忽略
        return
      }

      if (!pid || !port) {
        return
      }

      // 检查进程是否还在运行
      const isRunning = await this.isProcessRunning(pid)
      if (!isRunning) {
        this.logger.log(`[Verdaccio] PID ${pid} 的进程已不存在，清理 PID 文件`)
        await this.deletePidFile()
        return
      }

      // 检查端口是否在监听
      const isPortListening = await this.checkVerdaccioPortRunning(port)
      if (!isPortListening) {
        this.logger.warn(`[Verdaccio] PID ${pid} 的进程存在，但端口 ${port} 未监听，清理 PID 文件`)
        await this.deletePidFile()
        return
      }

      // 恢复进程信息
      this.verdaccioProcess = {
        process: null, // 独立进程没有 process 引用
        pid,
        port,
        configPath: this.VERDACCIO_CONFIG_PATH,
        storagePath: this.VERDACCIO_STORAGE_PATH,
        startedAt: new Date(), // 无法获取真实启动时间，使用当前时间
        isDetached: true,
      }

      this.logger.log(`[Verdaccio] 成功恢复 Verdaccio 进程: PID=${pid}, Port=${port}`)
    } catch (error: any) {
      this.logger.error(`[Verdaccio] 恢复进程时出错: ${error.message}`)
    }
  }

  /**
   * 检查进程是否在运行
   */
  private async isProcessRunning(pid: number): Promise<boolean> {
    try {
      if (process.platform === 'win32') {
        // Windows: 使用 tasklist 命令
        const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}"`)
        return stdout.includes(String(pid))
      } else {
        // Unix/Linux/Mac: 使用 kill -0 命令
        await execAsync(`kill -0 ${pid}`)
        return true
      }
    } catch {
      return false
    }
  }

  /**
   * 写入 PID 文件
   */
  private async writePidFile(pid: number, port: number): Promise<void> {
    try {
      // 确保目录存在
      await fs.mkdir(this.VERDACCIO_PID_DIR, { recursive: true })
      
      // 写入 PID 和端口信息
      const pidData = {
        pid,
        port,
        startedAt: new Date().toISOString(),
      }
      await fs.writeFile(this.VERDACCIO_PID_FILE, JSON.stringify(pidData, null, 2), 'utf-8')
      this.logger.debug(`[Verdaccio] PID 文件已写入: PID=${pid}, Port=${port}`)
    } catch (error: any) {
      this.logger.error(`[Verdaccio] 写入 PID 文件失败: ${error.message}`)
    }
  }

  /**
   * 删除 PID 文件
   */
  private async deletePidFile(): Promise<void> {
    try {
      await fs.unlink(this.VERDACCIO_PID_FILE)
      this.logger.debug(`[Verdaccio] PID 文件已删除`)
    } catch (error: any) {
      // 文件不存在时忽略错误
      if ((error as any).code !== 'ENOENT') {
        this.logger.error(`[Verdaccio] 删除 PID 文件失败: ${error.message}`)
      }
    }
  }

  /**
   * 检查指定端口是否有 Verdaccio 服务在运行
   */
  private async checkVerdaccioPortRunning(port: number): Promise<boolean> {
    try {
      // 尝试通过 HTTP 请求检查 Verdaccio 是否在运行
      const http = await import('http')
      return new Promise((resolve, reject) => {
        try {
          const req = http.get(`http://localhost:${port}/`, { timeout: 2000 }, (res) => {
            // 如果收到响应（无论状态码），说明服务在运行
            resolve(true)
            if (!res.destroyed) {
              res.destroy()
            }
          })
          
          req.on('error', (err: any) => {
            // 忽略连接错误，说明端口未被占用
            if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET' || err.message?.includes('aborted')) {
              resolve(false)
            } else {
              // 其他错误也认为端口未被占用
              resolve(false)
            }
          })
          
          req.on('timeout', () => {
            if (!req.destroyed) {
              req.destroy()
            }
            resolve(false)
          })
          
          // 确保请求不会挂起
          req.setTimeout(2000, () => {
            if (!req.destroyed) {
              req.destroy()
            }
            resolve(false)
          })
        } catch (err: any) {
          // 如果创建请求时出错，认为端口未被占用
          resolve(false)
        }
      })
    } catch (error: any) {
      // 任何错误都认为端口未被占用
      this.logger.debug(`[Verdaccio] 检查端口 ${port} 时出错: ${error.message}`)
      return false
    }
  }

  /**
   * 检查 Verdaccio 配置文件是否允许用户注册
   * 通过检查配置文件中 auth.htpasswd.max_users 的值来判断
   */
  private async checkVerdaccioConfigAllowsRegistration(port: number): Promise<boolean> {
    try {
      // 尝试读取 Verdaccio 配置文件
      // 配置文件路径可能是：
      // 1. ~/.ldesign/verdaccio/config.yaml（我们创建的）
      // 2. ~/.config/verdaccio/config.yaml（Verdaccio 默认）
      // 3. ~/.verdaccio/config.yaml（Verdaccio 默认）
      
      const configPaths = [
        this.VERDACCIO_CONFIG_PATH,
        join(homedir(), '.config', 'verdaccio', 'config.yaml'),
        join(homedir(), '.verdaccio', 'config.yaml'),
      ]
      
      for (const configPath of configPaths) {
        try {
          const configContent = await fs.readFile(configPath, 'utf-8')
          
          // 解析 YAML 配置（简单解析，查找 max_users）
          // 查找 auth.htpasswd.max_users 的值
          // 支持多种格式：
          // - max_users: 1000
          // - max_users: -1
          // - max_users: 0
          const maxUsersMatch = configContent.match(/max_users:\s*(-?\d+)/i)
          if (maxUsersMatch) {
            const maxUsers = parseInt(maxUsersMatch[1], 10)
            // max_users: -1 或 0 表示不允许注册
            // max_users > 0 表示允许注册
            this.logger.debug(`[Verdaccio] 配置文件 ${configPath} 中 max_users = ${maxUsers}`)
            return maxUsers > 0
          }
          
          // 如果没有找到 max_users，默认允许注册（Verdaccio 默认行为）
          this.logger.debug(`[Verdaccio] 配置文件 ${configPath} 中未找到 max_users，默认允许注册`)
          return true
        } catch (fileError: any) {
          // 文件不存在或读取失败，继续尝试下一个路径
          if (fileError.code !== 'ENOENT') {
            this.logger.debug(`[Verdaccio] 读取配置文件 ${configPath} 失败: ${fileError.message}`)
          }
          continue
        }
      }
      
      // 如果找不到配置文件，默认允许注册（因为我们创建的配置是允许的）
      this.logger.debug(`[Verdaccio] 未找到配置文件，默认允许注册`)
      return true
    } catch (error: any) {
      // 如果读取失败，默认允许注册
      this.logger.warn(`[Verdaccio] 检查配置失败: ${error.message}，默认允许注册`)
      return true
    }
  }

  /**
   * 获取 Verdaccio 配置文件路径
   */
  private async getVerdaccioConfigPath(registryId: string): Promise<string> {
    const registry = await this.findOne(registryId)
    const registryUrl = registry.registry.toLowerCase().replace(/\/$/, '')
    const registryName = (registry.name || '').toLowerCase()
    
    // 判断是否为本地 Verdaccio
    const isLocalhost = registryUrl.includes('localhost') || registryUrl.includes('127.0.0.1')
    const hasVerdaccioName = registryName.includes('verdaccio')
    
    if (!isLocalhost || !hasVerdaccioName) {
      throw new Error('该仓库不是本地 Verdaccio 仓库')
    }
    
    // 返回我们创建的配置文件路径
    return this.VERDACCIO_CONFIG_PATH
  }

  /**
   * 获取 Verdaccio 配置文件内容
   */
  async getVerdaccioConfig(registryId: string): Promise<{ content: string; path: string }> {
    const configPath = await this.getVerdaccioConfigPath(registryId)
    
    try {
      const content = await fs.readFile(configPath, 'utf-8')
      return {
        content,
        path: configPath,
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error('Verdaccio 配置文件不存在')
      }
      throw new Error(`读取配置文件失败: ${error.message}`)
    }
  }

  /**
   * 从配置内容中解析端口号
   */
  private parsePortFromConfig(content: string): number | null {
    try {
      const config = yaml.load(content) as any
      
      // 支持多种配置格式
      // 格式1: listen: 0.0.0.0:4873
      // 格式2: listen: "0.0.0.0:4873"
      // 格式3: listen: [0.0.0.0:4873]
      // 格式4: listen: { host: "0.0.0.0", port: 4873 }
      
      if (!config || !config.listen) {
        return null
      }
      
      const listen = config.listen
      
      // 如果是对象格式 { host: "0.0.0.0", port: 4873 }
      if (typeof listen === 'object' && !Array.isArray(listen) && listen.port) {
        return parseInt(String(listen.port), 10)
      }
      
      // 如果是字符串或数组格式
      const listenStr = Array.isArray(listen) ? listen[0] : String(listen)
      
      // 解析 "0.0.0.0:4873" 或 "[::1]:4873" 格式
      const match = listenStr.match(/:(\d+)$/)
      if (match && match[1]) {
        return parseInt(match[1], 10)
      }
      
      return null
    } catch (error: any) {
      this.logger.warn(`[Verdaccio] 解析配置端口失败: ${error.message}`)
      return null
    }
  }

  /**
   * 保存 Verdaccio 配置文件
   */
  async saveVerdaccioConfig(registryId: string, content: string): Promise<void> {
    const configPath = await this.getVerdaccioConfigPath(registryId)
    
    try {
      // 验证 YAML 格式
      if (!content.trim()) {
        throw new Error('配置文件内容不能为空')
      }
      
      // 验证 YAML 格式是否正确
      try {
        yaml.load(content)
      } catch (yamlError: any) {
        throw new Error(`YAML 格式错误: ${yamlError.message}`)
      }
      
      // 从配置内容中解析端口号（保存前解析，用于重启）
      const newPort = this.parsePortFromConfig(content)
      
      // 备份原配置文件
      try {
        const backupPath = `${configPath}.backup.${Date.now()}`
        const originalContent = await fs.readFile(configPath, 'utf-8')
        await fs.writeFile(backupPath, originalContent, 'utf-8')
        this.logger.log(`[Verdaccio] 已备份配置文件到: ${backupPath}`)
      } catch {
        // 如果备份失败，继续保存（可能是首次创建）
      }
      
      // 保存新配置
      await fs.writeFile(configPath, content, 'utf-8')
      this.logger.log(`[Verdaccio] 配置文件已保存: ${configPath}`)
      
      // 发送配置保存事件
      if (this.wsEventsService) {
        this.wsEventsService.sendVerdaccioConfigSaved({
          registryId,
          status: 'started',
          message: '配置文件已保存',
          progress: 100,
        })
      }
      
      // 如果 Verdaccio 正在运行，立即重启服务使配置生效
      const verdaccioStatus = await this.getLocalVerdaccioStatus()
      if (verdaccioStatus.running) {
        // 使用配置中的新端口（如果解析成功），否则使用当前运行的端口
        const restartPort = newPort || verdaccioStatus.port || this.DEFAULT_VERDACCIO_PORT
        this.logger.log(`[Verdaccio] 配置已更新，正在重启 Verdaccio 服务（端口 ${restartPort}）使配置生效...`)
        try {
          // 异步重启，不阻塞保存操作
          // 如果重启失败，记录错误但不影响保存成功
          this.restartLocalVerdaccio(restartPort, registryId).catch((restartError: any) => {
            this.logger.error(`[Verdaccio] 配置保存成功，但重启服务失败: ${restartError.message}`)
          })
        } catch (restartError: any) {
          this.logger.error(`[Verdaccio] 配置保存成功，但重启服务失败: ${restartError.message}`)
        }
      } else {
        this.logger.log(`[Verdaccio] 配置已保存，Verdaccio 服务未运行，无需重启`)
      }
    } catch (error: any) {
      this.logger.error(`[Verdaccio] 保存配置文件失败: ${error.message}`)
      throw new Error(`保存配置文件失败: ${error.message}`)
    }
  }

  /**
   * 解析 Verdaccio 配置文件为结构化数据
   */
  async parseVerdaccioConfig(registryId: string): Promise<any> {
    const configPath = await this.getVerdaccioConfigPath(registryId)
    
    try {
      const content = await fs.readFile(configPath, 'utf-8')
      const config = yaml.load(content) as any
      return config
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error('Verdaccio 配置文件不存在')
      }
      throw new Error(`解析配置文件失败: ${error.message}`)
    }
  }

  /**
   * 将结构化数据保存为 Verdaccio 配置文件
   */
  async saveVerdaccioConfigFromObject(registryId: string, config: any): Promise<void> {
    const configPath = await this.getVerdaccioConfigPath(registryId)
    
    try {
      // 从配置对象中解析端口号（保存前解析，用于重启）
      let newPort: number | null = null
      if (config && config.listen) {
        const listen = config.listen
        // 如果是对象格式 { host: "0.0.0.0", port: 4873 }
        if (typeof listen === 'object' && !Array.isArray(listen) && listen.port) {
          newPort = parseInt(String(listen.port), 10)
        }
        // 如果是字符串格式 "0.0.0.0:4873"
        else if (typeof listen === 'string') {
          const match = listen.match(/:(\d+)$/)
          if (match && match[1]) {
            newPort = parseInt(match[1], 10)
          }
        }
        // 如果是数组格式 ["0.0.0.0:4873"]
        else if (Array.isArray(listen) && listen.length > 0) {
          const match = String(listen[0]).match(/:(\d+)$/)
          if (match && match[1]) {
            newPort = parseInt(match[1], 10)
          }
        }
      }
      
      // 将对象转换为 YAML
      const content = yaml.dump(config, {
        indent: 2,
        lineWidth: -1,
        quotingType: '"',
        forceQuotes: false,
      })
      
      // 备份原配置文件
      try {
        const backupPath = `${configPath}.backup.${Date.now()}`
        const originalContent = await fs.readFile(configPath, 'utf-8')
        await fs.writeFile(backupPath, originalContent, 'utf-8')
        this.logger.log(`[Verdaccio] 已备份配置文件到: ${backupPath}`)
      } catch {
        // 如果备份失败，继续保存（可能是首次创建）
      }
      
      // 保存新配置
      await fs.writeFile(configPath, content, 'utf-8')
      this.logger.log(`[Verdaccio] 配置文件已保存: ${configPath}`)
      
      // 发送配置保存事件
      if (this.wsEventsService) {
        this.wsEventsService.sendVerdaccioConfigSaved({
          registryId,
          status: 'started',
          message: '配置文件已保存',
          progress: 100,
        })
      }
      
      // 如果 Verdaccio 正在运行，立即重启服务使配置生效
      const verdaccioStatus = await this.getLocalVerdaccioStatus()
      if (verdaccioStatus.running) {
        // 使用配置中的新端口（如果解析成功），否则使用当前运行的端口
        const restartPort = newPort || verdaccioStatus.port || this.DEFAULT_VERDACCIO_PORT
        this.logger.log(`[Verdaccio] 配置已更新，正在重启 Verdaccio 服务（端口 ${restartPort}）使配置生效...`)
        try {
          // 异步重启，不阻塞保存操作
          // 如果重启失败，记录错误但不影响保存成功
          this.restartLocalVerdaccio(restartPort, registryId).catch((restartError: any) => {
            this.logger.error(`[Verdaccio] 配置保存成功，但重启服务失败: ${restartError.message}`)
          })
        } catch (restartError: any) {
          this.logger.error(`[Verdaccio] 配置保存成功，但重启服务失败: ${restartError.message}`)
        }
      } else {
        this.logger.log(`[Verdaccio] 配置已保存，Verdaccio 服务未运行，无需重启`)
      }
    } catch (error: any) {
      this.logger.error(`[Verdaccio] 保存配置文件失败: ${error.message}`)
      throw new Error(`保存配置文件失败: ${error.message}`)
    }
  }

  /**
   * 获取 Verdaccio 配置项结构定义
   * 返回所有可配置项的元数据（基于 Verdaccio 6.x 完整配置）
   */
  getVerdaccioConfigSchema(): any {
    return {
      // ========== 核心配置 ==========
      storage: {
        type: 'string',
        description: '包存储路径（必需）',
        required: true,
      },
      plugins: {
        type: 'string',
        description: '插件目录路径（可选，默认 ./plugins）',
      },
      listen: {
        type: 'string',
        description: '监听地址和端口（格式: 0.0.0.0:端口号 或 [::1]:端口号，必需）',
        required: true,
      },
      web: {
        type: 'object',
        description: 'Web UI 配置',
        properties: {
          title: { type: 'string', description: 'Web UI 标题' },
          gravatar: { type: 'boolean', description: '是否启用 Gravatar 头像' },
          scope: { type: 'string', description: 'Scope 前缀（如 @ldesign）' },
          sort_packages: { type: 'string', description: '包排序方式', enum: ['asc', 'desc'] },
          darkMode: { type: 'boolean', description: '是否启用暗黑模式' },
          login: { type: 'boolean', description: '是否显示登录按钮' },
          pkgManagers: { type: 'array', description: '包管理器列表', items: { type: 'string' } },
          showInfo: { type: 'boolean', description: '是否显示信息' },
          showSettings: { type: 'boolean', description: '是否显示设置' },
          showFooter: { type: 'boolean', description: '是否显示页脚' },
          showSearch: { type: 'boolean', description: '是否显示搜索' },
          showDownloadTarball: { type: 'boolean', description: '是否显示下载链接' },
          showRaw: { type: 'boolean', description: '是否显示原始数据' },
          base: { type: 'string', description: 'Web UI 基础路径' },
          favicon: { type: 'string', description: 'Favicon 路径' },
          logo: { type: 'string', description: 'Logo 路径' },
          primaryColor: { type: 'string', description: '主题主色' },
          language: { type: 'string', description: '语言设置' },
        },
      },
      auth: {
        type: 'object',
        description: '认证配置',
        properties: {
          htpasswd: {
            type: 'object',
            description: 'htpasswd 认证配置',
            properties: {
              file: { type: 'string', description: 'htpasswd 文件路径' },
              max_users: { type: 'number', description: '最大用户数（-1 或 0 表示不允许注册，> 0 表示允许注册）' },
              algorithm: { type: 'string', description: '密码算法', enum: ['bcrypt', 'md5', 'sha1', 'crypt'] },
              rounds: { type: 'number', description: '加密轮数（仅 bcrypt，默认 10）' },
            },
          },
          legacy: { type: 'boolean', description: '是否启用旧版认证' },
          gitlab: { type: 'object', description: 'GitLab 认证配置', additionalProperties: true },
          github: { type: 'object', description: 'GitHub 认证配置', additionalProperties: true },
          bitbucket: { type: 'object', description: 'Bitbucket 认证配置', additionalProperties: true },
          oauth: { type: 'object', description: 'OAuth 认证配置', additionalProperties: true },
          saml: { type: 'object', description: 'SAML 认证配置', additionalProperties: true },
          ldap: { type: 'object', description: 'LDAP 认证配置', additionalProperties: true },
        },
      },
      uplinks: {
        type: 'object',
        description: '上游源配置（动态键名）',
        additionalProperties: {
          type: 'object',
          properties: {
            url: { type: 'string', description: '上游源 URL（必需）', required: true },
            cache: { type: 'boolean', description: '是否缓存（默认 true）' },
            timeout: { type: 'string', description: '超时时间（如 10s, 1m）' },
            max_fails: { type: 'number', description: '最大失败次数（默认 2）' },
            fail_timeout: { type: 'string', description: '失败超时时间（如 5m）' },
            agent_options: {
              type: 'object',
              description: 'HTTP Agent 选项',
              properties: {
                keepAlive: { type: 'boolean', description: '是否保持连接' },
                keepAliveMsecs: { type: 'number', description: 'Keep-Alive 间隔（毫秒）' },
                maxSockets: { type: 'number', description: '最大套接字数' },
                maxFreeSockets: { type: 'number', description: '最大空闲套接字数' },
              },
            },
            headers: { type: 'object', description: '自定义请求头', additionalProperties: { type: 'string' } },
            ca: { type: 'string', description: 'CA 证书路径' },
            cert: { type: 'string', description: '客户端证书路径' },
            key: { type: 'string', description: '客户端密钥路径' },
            strict_ssl: { type: 'boolean', description: '是否严格验证 SSL' },
          },
        },
      },
      packages: {
        type: 'object',
        description: '包访问权限配置（键名为包名模式，如 @ldesign/*, **）',
        additionalProperties: {
          type: 'object',
          properties: {
            access: {
              type: 'array',
              description: '访问权限列表（$all, $anonymous, $authenticated, 用户名）',
              items: { type: 'string' },
            },
            publish: {
              type: 'array',
              description: '发布权限列表（$all, $anonymous, $authenticated, 用户名）',
              items: { type: 'string' },
            },
            unpublish: {
              type: 'array',
              description: '取消发布权限列表（$all, $anonymous, $authenticated, 用户名）',
              items: { type: 'string' },
            },
            proxy: { type: 'string', description: '代理上游源名称（uplinks 中的键名）' },
            storage: { type: 'string', description: '存储路径（覆盖默认 storage）' },
            allow_access: {
              type: 'array',
              description: '允许访问的用户列表',
              items: { type: 'string' },
            },
            allow_publish: {
              type: 'array',
              description: '允许发布的用户列表',
              items: { type: 'string' },
            },
            allow_unpublish: {
              type: 'array',
              description: '允许取消发布的用户列表',
              items: { type: 'string' },
            },
            deny_access: {
              type: 'array',
              description: '拒绝访问的用户列表',
              items: { type: 'string' },
            },
            deny_publish: {
              type: 'array',
              description: '拒绝发布的用户列表',
              items: { type: 'string' },
            },
            deny_unpublish: {
              type: 'array',
              description: '拒绝取消发布的用户列表',
              items: { type: 'string' },
            },
          },
        },
      },
      server: {
        type: 'object',
        description: '服务器配置',
        properties: {
          keepAliveTimeout: { type: 'number', description: 'Keep-Alive 超时时间（秒，默认 60）' },
          maxAge: { type: 'number', description: '静态资源缓存时间（秒）' },
          rateLimit: {
            type: 'object',
            description: '速率限制配置',
            properties: {
              windowMs: { type: 'number', description: '时间窗口（毫秒）' },
              max: { type: 'number', description: '最大请求数' },
            },
          },
          enable: { type: 'boolean', description: '是否启用服务器' },
          trustProxy: { type: 'boolean', description: '是否信任代理' },
          xForwardedFor: { type: 'boolean', description: '是否使用 X-Forwarded-For 头' },
        },
      },
      middlewares: {
        type: 'object',
        description: '中间件配置',
        properties: {
          audit: {
            type: 'object',
            description: '审计中间件配置',
            properties: {
              enabled: { type: 'boolean', description: '是否启用审计' },
            },
          },
          rateLimit: {
            type: 'object',
            description: '速率限制中间件配置',
            properties: {
              enabled: { type: 'boolean', description: '是否启用速率限制' },
              windowMs: { type: 'number', description: '时间窗口（毫秒）' },
              max: { type: 'number', description: '最大请求数' },
            },
          },
        },
      },
      logs: {
        type: 'object',
        description: '日志配置（对象格式，Verdaccio 6.x）',
        properties: {
          type: { type: 'string', enum: ['stdout', 'file'], description: '日志类型' },
          format: {
            type: 'string',
            enum: ['pretty', 'pretty-timestamped', 'json'],
            description: '日志格式',
          },
          level: {
            type: 'string',
            enum: ['fatal', 'error', 'warn', 'http', 'info', 'debug', 'trace'],
            description: '日志级别',
          },
          path: { type: 'string', description: '日志文件路径（仅 file 类型）' },
          rotate: {
            type: 'object',
            description: '日志轮转配置',
            properties: {
              enabled: { type: 'boolean', description: '是否启用轮转' },
              maxFiles: { type: 'number', description: '最大文件数' },
              maxSize: { type: 'string', description: '最大文件大小（如 10M）' },
            },
          },
        },
      },
      log: {
        type: 'object',
        description: '日志配置（单数形式，兼容旧版）',
        properties: {
          type: { type: 'string', enum: ['stdout', 'file'] },
          format: { type: 'string', enum: ['pretty', 'pretty-timestamped', 'json'] },
          level: { type: 'string', enum: ['fatal', 'error', 'warn', 'http', 'info', 'debug', 'trace'] },
          path: { type: 'string', description: '日志文件路径' },
        },
      },
      publish: {
        type: 'object',
        description: '发布配置',
        properties: {
          allow_offline: { type: 'boolean', description: '是否允许离线发布（默认 false）' },
          allow_publish: { type: 'array', description: '允许发布的用户列表', items: { type: 'string' } },
          deny_publish: { type: 'array', description: '拒绝发布的用户列表', items: { type: 'string' } },
        },
      },
      store: {
        type: 'object',
        description: '存储配置',
        properties: {
          memory: {
            type: 'object',
            description: '内存存储配置',
            properties: {
              limit: { type: 'number', description: '内存限制（包数量）' },
            },
          },
        },
      },
      url_prefix: {
        type: 'string',
        description: 'URL 前缀（如 /verdaccio）',
      },
      max_body_size: {
        type: 'string',
        description: '最大请求体大小（如 10mb, 1gb）',
      },
      security: {
        type: 'object',
        description: '安全配置',
        properties: {
          api: {
            type: 'object',
            description: 'API 安全配置',
            properties: {
              legacy: { type: 'boolean', description: '是否启用旧版 API（默认 false）' },
              jwt: {
                type: 'object',
                description: 'JWT 配置',
                properties: {
                  sign: { type: 'object', description: 'JWT 签名配置', additionalProperties: true },
                  verify: { type: 'object', description: 'JWT 验证配置', additionalProperties: true },
                },
              },
            },
          },
          web: {
            type: 'object',
            description: 'Web 安全配置',
            properties: {
              sign: { type: 'object', description: 'Web 签名配置', additionalProperties: true },
              verify: { type: 'object', description: 'Web 验证配置', additionalProperties: true },
            },
          },
        },
      },
      flags: {
        type: 'object',
        description: '功能标志配置',
        properties: {
          changePassword: { type: 'boolean', description: '是否允许修改密码' },
          changePasswordPlugin: { type: 'string', description: '修改密码插件' },
          searchRemote: { type: 'boolean', description: '是否搜索远程仓库' },
          userRateLimit: {
            type: 'object',
            description: '用户速率限制',
            properties: {
              windowMs: { type: 'number', description: '时间窗口（毫秒）' },
              max: { type: 'number', description: '最大请求数' },
            },
          },
        },
      },
      // ========== 其他配置 ==========
      user_agent: {
        type: 'string',
        description: 'User-Agent 字符串（用于上游请求）',
      },
      notify: {
        type: 'object',
        description: '通知配置（支持多种通知方式：slack, discord, telegram, email, webhook 等）',
        additionalProperties: {
          type: 'object',
          description: '通知服务配置（每个键名对应一种通知方式）',
          additionalProperties: true,
        },
      },
      healthcheck: {
        type: 'object',
        description: '健康检查配置',
        properties: {
          enabled: { type: 'boolean', description: '是否启用健康检查' },
          path: { type: 'string', description: '健康检查路径（默认 /-/healthz）' },
        },
      },
      experiments: {
        type: 'object',
        description: '实验性功能配置',
        properties: {
          changePassword: { type: 'boolean', description: '是否启用修改密码功能' },
          token: { type: 'boolean', description: '是否启用 Token 功能' },
          search: { type: 'boolean', description: '是否启用搜索功能' },
        },
      },
      i18n: {
        type: 'object',
        description: '国际化配置',
        properties: {
          web: { type: 'string', description: 'Web UI 语言（如 zh-CN, en-US, fr-FR 等）' },
          fallback: { type: 'string', description: '回退语言（默认 en-US）' },
        },
      },
      https: {
        type: 'object',
        description: 'HTTPS 配置',
        properties: {
          enable: { type: 'boolean', description: '是否启用 HTTPS' },
          key: { type: 'string', description: '私钥文件路径' },
          cert: { type: 'string', description: '证书文件路径' },
          ca: { type: 'string', description: 'CA 证书文件路径（可选）' },
          port: { type: 'number', description: 'HTTPS 端口（默认 443）' },
        },
      },
      proxy: {
        type: 'object',
        description: '代理配置',
        properties: {
          http_proxy: { type: 'string', description: 'HTTP 代理地址（如 http://proxy.example.com:8080）' },
          https_proxy: { type: 'string', description: 'HTTPS 代理地址（如 https://proxy.example.com:8080）' },
          no_proxy: { type: 'string', description: '不使用代理的地址列表（逗号分隔，如 localhost,127.0.0.1）' },
        },
      },
      userRateLimit: {
        type: 'object',
        description: '用户速率限制配置（全局）',
        properties: {
          windowMs: { type: 'number', description: '时间窗口（毫秒，默认 60000）' },
          max: { type: 'number', description: '最大请求数（默认 1000）' },
        },
      },
      search: {
        type: 'object',
        description: '搜索配置',
        properties: {
          query: {
            type: 'object',
            description: '查询配置',
            properties: {
              limit: { type: 'number', description: '查询结果限制（默认 20）' },
              quality: { type: 'number', description: '质量阈值（0-1，默认 0.65）' },
              popularity: { type: 'number', description: '流行度阈值（0-1，默认 0.98）' },
              maintenance: { type: 'number', description: '维护度阈值（0-1，默认 0.5）' },
            },
          },
        },
      },
      // ========== 环境变量配置（通过配置文件）==========
      http_proxy: {
        type: 'string',
        description: 'HTTP 代理地址（环境变量，与 proxy.http_proxy 等效）',
      },
      https_proxy: {
        type: 'string',
        description: 'HTTPS 代理地址（环境变量，与 proxy.https_proxy 等效）',
      },
      no_proxy: {
        type: 'string',
        description: '不使用代理的地址列表（环境变量，与 proxy.no_proxy 等效）',
      },
      // ========== 其他 Verdaccio 配置项 ==========
      offline_mode: {
        type: 'boolean',
        description: '是否启用离线模式（默认 false）',
      },
      self_path: {
        type: 'string',
        description: '自路径（用于生成包的完整 URL）',
      },
      secret: {
        type: 'string',
        description: '密钥（用于 JWT 签名，建议使用随机字符串）',
      },
      verify_url: {
        type: 'string',
        description: '验证 URL（用于邮件验证等）',
      },
      tags: {
        type: 'object',
        description: '标签配置',
        additionalProperties: {
          type: 'object',
          description: '标签配置对象',
          additionalProperties: true,
        },
      },
      timeouts: {
        type: 'object',
        description: '超时配置',
        properties: {
          connect: { type: 'number', description: '连接超时（毫秒）' },
          request: { type: 'number', description: '请求超时（毫秒）' },
          socket: { type: 'number', description: '套接字超时（毫秒）' },
        },
      },
      max_request_size: {
        type: 'string',
        description: '最大请求大小（如 10mb, 1gb，与 max_body_size 等效）',
      },
      enable: {
        type: 'boolean',
        description: '是否启用 Verdaccio（默认 true）',
      },
      enable_proxy: {
        type: 'boolean',
        description: '是否启用代理功能（默认 true）',
      },
      enable_web: {
        type: 'boolean',
        description: '是否启用 Web UI（默认 true）',
      },
      enable_audit: {
        type: 'boolean',
        description: '是否启用审计功能（默认 false）',
      },
      enable_rate_limit: {
        type: 'boolean',
        description: '是否启用速率限制（默认 true）',
      },
      enable_search: {
        type: 'boolean',
        description: '是否启用搜索功能（默认 true）',
      },
      enable_healthcheck: {
        type: 'boolean',
        description: '是否启用健康检查（默认 true）',
      },
      enable_notify: {
        type: 'boolean',
        description: '是否启用通知功能（默认 false）',
      },
      enable_experiments: {
        type: 'boolean',
        description: '是否启用实验性功能（默认 false）',
      },
      enable_i18n: {
        type: 'boolean',
        description: '是否启用国际化（默认 true）',
      },
      enable_https: {
        type: 'boolean',
        description: '是否启用 HTTPS（默认 false）',
      },
      enable_user_rate_limit: {
        type: 'boolean',
        description: '是否启用用户速率限制（默认 true）',
      },
      enable_offline_mode: {
        type: 'boolean',
        description: '是否启用离线模式（默认 false）',
      },
      enable_self_path: {
        type: 'boolean',
        description: '是否启用自路径（默认 false）',
      },
      enable_secret: {
        type: 'boolean',
        description: '是否启用密钥（默认 true）',
      },
      enable_verify_url: {
        type: 'boolean',
        description: '是否启用验证 URL（默认 false）',
      },
      enable_tags: {
        type: 'boolean',
        description: '是否启用标签功能（默认 true）',
      },
      enable_timeouts: {
        type: 'boolean',
        description: '是否启用超时配置（默认 true）',
      },
      enable_max_request_size: {
        type: 'boolean',
        description: '是否启用最大请求大小限制（默认 true）',
      },
    }
  }

  /**
   * 检查仓库是否支持用户注册（Verdaccio）
   */
  async checkRegistrySupportsUserRegistration(registryId: string): Promise<{ supports: boolean; isVerdaccio: boolean }> {
    const registry = await this.findOne(registryId)
    const registryUrl = registry.registry.toLowerCase().replace(/\/$/, '')
    const registryName = (registry.name || '').toLowerCase()
    
    // 判断是否为本地 Verdaccio
    // 条件1: URL 必须是 localhost 或 127.0.0.1
    const isLocalhost = registryUrl.includes('localhost') || registryUrl.includes('127.0.0.1')
    
    // 条件2: 名称包含 verdaccio，或者 URL 是 localhost 且端口是 4873（Verdaccio 默认端口）
    const urlMatch = registry.registry.match(/localhost:(\d+)/i) || registry.registry.match(/127\.0\.0\.1:(\d+)/i)
    const port = urlMatch ? parseInt(urlMatch[1], 10) : null
    const isDefaultVerdaccioPort = port === 4873
    
    const hasVerdaccioName = registryName.includes('verdaccio')
    const isVerdaccio = isLocalhost && (hasVerdaccioName || isDefaultVerdaccioPort)
    
    // 如果是 Verdaccio，检查服务是否在运行，以及配置是否允许注册
    if (isVerdaccio && port) {
      try {
        const isRunning = await this.checkVerdaccioPortRunning(port)
        if (!isRunning) {
          return {
            supports: false,
            isVerdaccio: true,
          }
        }
        
        // 检查配置是否允许注册
        const allowsRegistration = await this.checkVerdaccioConfigAllowsRegistration(port)
        
        return {
          supports: allowsRegistration,
          isVerdaccio: true,
        }
      } catch {
        // 忽略错误
      }
    }
    
    return {
      supports: false,
      isVerdaccio,
    }
  }

  /**
   * 在 Verdaccio 中创建新用户
   * 使用标准的 npm registry API: PUT /-/user/org.couchdb.user:username
   * 
   * API 说明：
   * - 201: 用户创建成功
   * - 409: 用户已存在
   * - 403: 用户注册被禁用
   * - 401: 认证失败
   * - 其他: 其他错误
   */
  async createVerdaccioUser(registryId: string, username: string, password: string, email: string): Promise<void> {
    const registry = await this.findOne(registryId)
    
    // 检查是否为 Verdaccio
    const supportsCheck = await this.checkRegistrySupportsUserRegistration(registryId)
    if (!supportsCheck.isVerdaccio || !supportsCheck.supports) {
      throw new Error('该仓库不支持用户注册，或 Verdaccio 服务未运行')
    }
    
    this.logger.log(`[Verdaccio] 创建用户: ${username} @ ${registry.registry}`)
    
    // 直接使用 HTTP API 创建用户（最稳妥的方式）
    await this.createUserWithVerdaccioApi(registry.registry, username, password, email)
    this.logger.log(`[Verdaccio] ✅ 用户创建成功: ${username}`)
  }

  /**
   * 获取所有 NPM 仓库配置
   * 如果本地 Verdaccio 服务正在运行，则包含本地 Verdaccio 仓库
   * 如果本地 Verdaccio 服务未运行，则过滤掉本地 Verdaccio 仓库
   */
  async findAll(): Promise<NpmRegistry[]> {
    const allRegistries = await this.npmRegistryRepository.find({
      order: { order: 'ASC', createdAt: 'ASC' },
    })
    
    // 检查内存中的 Verdaccio 进程状态
    const verdaccioStatus = await this.getLocalVerdaccioStatus()
    let isVerdaccioRunning = verdaccioStatus.running
    let verdaccioPort = verdaccioStatus.port
    
    // 如果内存中没有进程，检查数据库中是否有本地 Verdaccio 仓库，并验证端口是否在运行
    if (!isVerdaccioRunning) {
      // 查找数据库中的本地 Verdaccio 仓库
      const localVerdaccioRegistries = allRegistries.filter((registry) => {
        const registryUrl = registry.registry.toLowerCase().replace(/\/$/, '')
        const registryName = (registry.name || '').toLowerCase()
        const isLocalhost = registryUrl.includes('localhost') || registryUrl.includes('127.0.0.1')
        const isLocalVerdaccioName = registryName.includes('本地 verdaccio') || 
                                     registryName.includes('local verdaccio') ||
                                     (registryName.includes('verdaccio') && isLocalhost)
        return isLocalhost && isLocalVerdaccioName
      })
      
      // 检查这些仓库的端口是否在运行
      for (const registry of localVerdaccioRegistries) {
        try {
          // 从 URL 中提取端口
          const urlMatch = registry.registry.match(/localhost:(\d+)/) || registry.registry.match(/127\.0\.0\.1:(\d+)/)
          if (urlMatch) {
            const port = parseInt(urlMatch[1], 10)
            const isRunning = await this.checkVerdaccioPortRunning(port)
            if (isRunning) {
              isVerdaccioRunning = true
              verdaccioPort = port
              break
            }
          }
        } catch {
          // 忽略错误，继续检查下一个
        }
      }
    }
    
    // 如果 Verdaccio 正在运行，确保本地仓库存在
    if (isVerdaccioRunning && verdaccioPort) {
      // 检查是否已存在本地 Verdaccio 仓库
      const localRegistryUrl = `http://localhost:${verdaccioPort}/`
      const existingLocalRegistry = allRegistries.find(
        (registry) => registry.registry === localRegistryUrl
      )
      
      // 如果不存在，创建本地 Verdaccio 仓库
      if (!existingLocalRegistry) {
        const localRegistry = await this.findOrCreateLocalVerdaccioRegistry(verdaccioPort)
        // 将新创建的仓库添加到列表中
        allRegistries.push(localRegistry)
        // 重新排序，确保 order 和 createdAt 顺序正确
        allRegistries.sort((a, b) => {
          if (a.order !== b.order) {
            return a.order - b.order
          }
          return a.createdAt.getTime() - b.createdAt.getTime()
        })
      }
    }
    
    // 如果 Verdaccio 未运行，过滤掉本地 Verdaccio 仓库
    if (!isVerdaccioRunning) {
      return allRegistries.filter((registry) => {
        // 判断是否为本地 Verdaccio 仓库
        const registryUrl = registry.registry.toLowerCase().replace(/\/$/, '')
        const registryName = (registry.name || '').toLowerCase()
        
        // 通过 URL 判断：localhost 或 127.0.0.1
        const isLocalhost = registryUrl.includes('localhost') || registryUrl.includes('127.0.0.1')
        
        // 通过名称判断：包含"本地 verdaccio"或"local verdaccio"
        const isLocalVerdaccioName = registryName.includes('本地 verdaccio') || 
                                     registryName.includes('local verdaccio') ||
                                     (registryName.includes('verdaccio') && isLocalhost)
        
        // 匹配条件：本地地址 + 名称包含verdaccio
        const isLocalVerdaccio = isLocalhost && isLocalVerdaccioName
        
        return !isLocalVerdaccio
      })
    }
    
    // Verdaccio 正在运行，返回所有仓库（包括本地 Verdaccio）
    return allRegistries
  }

  /**
   * 获取单个 NPM 仓库配置
   */
  async findOne(id: string): Promise<NpmRegistry> {
    const registry = await this.npmRegistryRepository.findOne({ where: { id } })
    if (!registry) {
      throw new NotFoundException(`NPM 仓库配置不存在: ${id}`)
    }
    return registry
  }

  /**
   * 创建 NPM 仓库配置
   */
  async create(createDto: CreateNpmRegistryDto): Promise<NpmRegistry> {
    // 如果设置为默认，取消其他默认设置
    if (createDto.isDefault) {
      await this.npmRegistryRepository.update({ isDefault: true }, { isDefault: false })
    }

    const registry = this.npmRegistryRepository.create(createDto)
    return this.npmRegistryRepository.save(registry)
  }

  /**
   * 更新 NPM 仓库配置
   */
  async update(id: string, updateDto: UpdateNpmRegistryDto): Promise<NpmRegistry> {
    const registry = await this.findOne(id)

    // 如果设置为默认，取消其他默认设置
    if (updateDto.isDefault && !registry.isDefault) {
      await this.npmRegistryRepository.update({ isDefault: true }, { isDefault: false })
    }

    Object.assign(registry, updateDto)
    return this.npmRegistryRepository.save(registry)
  }

  /**
   * 删除 NPM 仓库配置
   */
  async remove(id: string): Promise<void> {
    const registry = await this.findOne(id)
    await this.npmRegistryRepository.remove(registry)
  }

  /**
   * 获取 .npmrc 文件路径
   */
  private getNpmrcPath(): string {
    return join(homedir(), '.npmrc')
  }

  /**
   * 读取 .npmrc 文件内容
   */
  private async readNpmrc(): Promise<string> {
    const npmrcPath = this.getNpmrcPath()
    try {
      return await fs.readFile(npmrcPath, 'utf-8')
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return ''
      }
      throw error
    }
  }

  /**
   * 写入 .npmrc 文件
   */
  private async writeNpmrc(content: string): Promise<void> {
    const npmrcPath = this.getNpmrcPath()
    await fs.writeFile(npmrcPath, content, 'utf-8')
  }

  /**
   * 检测源类型（Verdaccio、npm 官方源等）
   */
  private async detectRegistryType(registryUrl: string): Promise<'verdaccio' | 'npmjs' | 'unknown'> {
    try {
      const { URL } = await import('url')
      const https = await import('https')
      const http = await import('http')
      
      const url = new URL(registryUrl.replace(/\/$/, ''))
      const client = url.protocol === 'https:' ? https : http
      
      // 尝试访问 /-/ping 端点（Verdaccio 和 npm 都支持）
      return new Promise((resolve) => {
        const requestOptions = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: '/-/ping',
          method: 'GET',
          timeout: 5000,
        }
        
        const req = client.request(requestOptions, (res) => {
          let data = ''
          res.on('data', (chunk) => { data += chunk.toString() })
          res.on('end', () => {
            // 检查响应头或内容判断类型
            const serverHeader = res.headers['server']
            const serverHeaderStr = Array.isArray(serverHeader) ? serverHeader[0] : (serverHeader || '')
            const contentType = res.headers['content-type']
            const contentTypeStr = Array.isArray(contentType) ? contentType[0] : (contentType || '')
            
            if (serverHeaderStr.toLowerCase().includes('verdaccio') || 
                registryUrl.includes('verdaccio') ||
                registryUrl.includes('4873')) {
              resolve('verdaccio')
            } else if (registryUrl.includes('npmjs.org') || 
                      registryUrl.includes('registry.npmjs.org')) {
              resolve('npmjs')
            } else {
              // 默认尝试 Verdaccio API
              resolve('verdaccio')
            }
          })
        })
        
        req.on('error', () => {
          // 出错时默认尝试 Verdaccio
          resolve('verdaccio')
        })
        
        req.on('timeout', () => {
          req.destroy()
          resolve('verdaccio')
        })
        
        req.end()
      })
    } catch (error) {
      // 出错时默认尝试 Verdaccio
      return 'verdaccio'
    }
  }

  /**
   * 通过 Verdaccio API 登录并获取 token
   */
  private async loginWithVerdaccioApi(registryUrl: string, username: string, password: string): Promise<string> {
    const { URL } = await import('url')
    const https = await import('https')
    const http = await import('http')
    
    const url = new URL(registryUrl.replace(/\/$/, ''))
    const client = url.protocol === 'https:' ? https : http
    
    // Verdaccio 登录 API: POST /-/v1/login
    const loginData = JSON.stringify({
      username,
      password,
    })
    
    const apiPath = '/-/v1/login'
    const fullUrl = `${url.protocol}//${url.hostname}:${url.port || (url.protocol === 'https:' ? 443 : 80)}${apiPath}`
    this.logger.log(`[NPM Login] 尝试 Verdaccio API: ${fullUrl}`)
    this.logger.log(`[NPM Login] 请求数据: ${JSON.stringify({ username, password: '***' })}`)
    
    return new Promise((resolve, reject) => {
      const port = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80)
      const requestOptions = {
        hostname: url.hostname,
        port,
        path: apiPath,
        method: 'POST',
        timeout: 15000, // 增加到 15 秒
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData),
          'User-Agent': 'LDesign-NPM-Manager/1.0',
          'Accept': 'application/json',
        },
        rejectUnauthorized: false, // 允许自签名证书
      }
      
      const req = client.request(requestOptions, (res) => {
        let data = ''
        
        this.logger.log(`[NPM Login] Verdaccio API 响应状态: ${res.statusCode}`)
        this.logger.log(`[NPM Login] Verdaccio API 响应头: ${JSON.stringify(res.headers)}`)
        
        res.on('data', (chunk) => {
          data += chunk.toString()
        })
        
        res.on('end', () => {
          this.logger.log(`[NPM Login] Verdaccio API 完整响应内容: ${data}`)
          
          if (res.statusCode === 201 || res.statusCode === 200) {
            try {
              const response = JSON.parse(data)
              this.logger.log(`[NPM Login] Verdaccio API 解析后的响应: ${JSON.stringify(response)}`)
              
              // Verdaccio 可能返回 token 在不同的字段中
              const token = response.token || response.data?.token || response.ok?.token
              
              if (token) {
                this.logger.log(`[NPM Login] Verdaccio API 登录成功，获取到 token (长度: ${token.length})`)
                resolve(token)
              } else {
                this.logger.error(`[NPM Login] Verdaccio API 响应中未找到 token，响应结构: ${JSON.stringify(response, null, 2)}`)
                // 尝试旧版 API
                this.logger.warn(`[NPM Login] 尝试使用旧版 Verdaccio API...`)
                this.loginWithVerdaccioLegacyApi(registryUrl, username, password)
                  .then(resolve)
                  .catch((legacyError) => {
                    reject(new Error(`Verdaccio API 响应中未找到 token。响应: ${JSON.stringify(response)}`))
                  })
              }
            } catch (parseError: any) {
              this.logger.error(`[NPM Login] 解析 Verdaccio API 响应失败: ${parseError.message}`)
              this.logger.error(`[NPM Login] 原始响应内容: ${data}`)
              // 尝试旧版 API
              this.logger.warn(`[NPM Login] 尝试使用旧版 Verdaccio API...`)
              this.loginWithVerdaccioLegacyApi(registryUrl, username, password)
                .then(resolve)
                .catch((legacyError) => {
                  reject(new Error(`解析 Verdaccio API 响应失败: ${parseError.message}。原始响应: ${data.substring(0, 500)}`))
                })
            }
          } else {
            // 如果新 API 返回非成功状态码，尝试旧 API
            const errorMessage = data || `HTTP ${res.statusCode}`
            this.logger.warn(`[NPM Login] Verdaccio 新 API 失败 (${res.statusCode}): ${errorMessage}`)
            this.logger.warn(`[NPM Login] 尝试使用旧版 Verdaccio API...`)
            this.loginWithVerdaccioLegacyApi(registryUrl, username, password)
              .then(resolve)
              .catch((legacyError) => {
                reject(new Error(`Verdaccio API 登录失败: HTTP ${res.statusCode} - ${errorMessage}。旧 API 也失败: ${legacyError.message}`))
              })
          }
        })
      })
      
      req.on('error', (error: Error) => {
        this.logger.error(`[NPM Login] Verdaccio API 请求错误: ${error.message}`)
        // 如果新 API 失败，尝试旧 API
        this.loginWithVerdaccioLegacyApi(registryUrl, username, password)
          .then(resolve)
          .catch((legacyError) => {
            reject(new Error(`Verdaccio API 请求失败: ${error.message}，旧 API 也失败: ${legacyError.message}`))
          })
      })
      
      req.on('timeout', () => {
        req.destroy()
        this.logger.error('[NPM Login] Verdaccio API 请求超时')
        reject(new Error('Verdaccio API 请求超时'))
      })
      
      req.write(loginData)
      req.end()
    })
  }


  /**
   * 通过 npm adduser 命令登录 Verdaccio
   * 这是最可靠的方式，适用于所有 Verdaccio 配置
   * @param isCreatingUser 是否在创建新用户（true）还是登录已存在的用户（false）
   */
  private async loginWithNpmAdduser(registryUrl: string, username: string, password: string, email: string, isCreatingUser: boolean = false): Promise<void> {
    // 如果是创建新用户，先尝试使用 Verdaccio API（虽然通常不支持）
    if (isCreatingUser) {
      try {
        await this.createUserWithVerdaccioApi(registryUrl, username, password, email)
        this.logger.log(`[NPM Login] 通过 Verdaccio API 创建用户成功`)
        // 然后使用 API 登录获取 token
        await this.loginWithVerdaccioApi(registryUrl, username, password)
        this.logger.log(`[NPM Login] Verdaccio API 登录成功`)
        return
      } catch (apiError: any) {
        this.logger.debug(`[NPM Login] Verdaccio API 创建用户失败: ${apiError.message}，尝试使用 npm adduser`)
      }
    }
    
    // 对于登录场景，直接使用 npm adduser（它会自动处理已存在用户的情况）
    
    // 如果 API 方式失败，使用 npm adduser
    // 使用 npm adduser 命令注册/登录用户
    // 注意：npm adduser 会提示输入用户名、密码和邮箱，我们需要通过 stdin 提供
    // 格式：用户名\n密码\n邮箱\n（每个输入后需要换行）
    const adduserInput = `${username}\n${password}\n${email}\n`
    
    this.logger.log(`[NPM Login] 使用 npm adduser 登录: ${registryUrl}`)
    
    try {
      // 执行 npm adduser，通过 stdin 提供输入
      const { spawn } = await import('child_process')
      // 使用 --always-auth=false 避免认证问题
      const npmProcess = spawn('npm', ['adduser', '--registry', registryUrl, '--always-auth=false'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: {
          ...process.env,
          // 设置非交互式环境变量
          CI: 'true',
          // 禁用 npm 的进度条
          NPM_CONFIG_PROGRESS: 'false',
        },
      })
      
      return new Promise((resolve, reject) => {
        let stdout = ''
        let stderr = ''
        let resolved = false
        let inputSent = false
        
        // 设置超时（60秒，因为 npm adduser 可能需要更长时间）
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true
            if (npmProcess && !npmProcess.killed) {
              npmProcess.kill('SIGTERM')
              // 如果 SIGTERM 无效，强制终止
              setTimeout(() => {
                if (npmProcess && !npmProcess.killed) {
                  npmProcess.kill('SIGKILL')
                }
              }, 2000)
            }
            reject(new Error('npm adduser 超时（60秒）'))
          }
        }, 60000)
        
        npmProcess.stdout?.on('data', (data) => {
          const output = data.toString()
          stdout += output
          this.logger.debug(`[NPM Login] npm adduser stdout: ${output}`)
          
          // 检测提示信息，适时发送输入
          if (!inputSent && (output.includes('Username:') || output.includes('username:') || output.includes('npm notice Log in'))) {
            inputSent = true
            setTimeout(() => {
              if (npmProcess.stdin && !npmProcess.stdin.destroyed) {
                npmProcess.stdin.write(adduserInput)
                npmProcess.stdin.end()
              }
            }, 200)
          }
        })
        
        npmProcess.stderr?.on('data', (data) => {
          const output = data.toString()
          stderr += output
          this.logger.debug(`[NPM Login] npm adduser stderr: ${output}`)
          
          // 检测提示信息，适时发送输入
          if (!inputSent && (output.includes('Username:') || output.includes('username:') || output.includes('npm notice Log in'))) {
            inputSent = true
            setTimeout(() => {
              if (npmProcess.stdin && !npmProcess.stdin.destroyed) {
                npmProcess.stdin.write(adduserInput)
                npmProcess.stdin.end()
              }
            }, 200)
          }
        })
        
        npmProcess.on('exit', (code, signal) => {
          clearTimeout(timeout)
          if (resolved) {
            return
          }
          resolved = true
          
          if (code === 0) {
            this.logger.log(`[NPM Login] npm adduser 成功`)
            resolve()
          } else {
            // 如果进程被信号终止，可能是超时或其他原因
            if (signal) {
              const errorMsg = `npm adduser 被信号终止: ${signal}`
              this.logger.error(`[NPM Login] ${errorMsg}`)
              reject(new Error(errorMsg))
            } else {
              const errorMsg = stderr || stdout || `npm adduser 失败，退出码: ${code}`
              this.logger.error(`[NPM Login] npm adduser 失败: ${errorMsg}`)
              // 如果错误信息包含 "Exit handler never called"，提供更友好的错误信息
              if (errorMsg.includes('Exit handler never called')) {
                reject(new Error('npm adduser 执行异常，这可能是 npm 版本问题。请尝试手动执行: npm adduser --registry=' + registryUrl))
              } else {
                reject(new Error(`npm adduser 失败: ${errorMsg}`))
              }
            }
          }
        })
        
        npmProcess.on('error', (error) => {
          clearTimeout(timeout)
          if (resolved) {
            return
          }
          resolved = true
          this.logger.error(`[NPM Login] npm adduser 进程错误: ${error.message}`)
          reject(new Error(`npm adduser 进程错误: ${error.message}`))
        })
        
        // 延迟发送输入，等待进程启动并显示提示
        // 如果 2 秒后还没有检测到提示，直接发送输入
        setTimeout(() => {
          if (!inputSent && npmProcess.stdin && !npmProcess.stdin.destroyed) {
            inputSent = true
            npmProcess.stdin.write(adduserInput)
            npmProcess.stdin.end()
          }
        }, 2000)
      })
    } catch (error: any) {
      this.logger.error(`[NPM Login] npm adduser 执行失败: ${error.message}`)
      throw error
    }
  }

  /**
   * 通过改进的 npm adduser 命令创建新用户
   * 这是专门用于创建用户的改进版本，具有更好的错误处理和兼容性
   */
  private async createUserWithNpmAdduser(registryUrl: string, username: string, password: string, email: string): Promise<void> {
    // 使用 npm adduser 命令注册新用户
    // 注意：npm adduser 会提示输入用户名、密码和邮箱，我们需要通过 stdin 提供
    // 格式：用户名\n密码\n邮箱\n（每个输入后需要换行）
    const adduserInput = `${username}\n${password}\n${email}\n`
    
    this.logger.log(`[Verdaccio] 使用 npm adduser 创建用户: ${username} @ ${registryUrl}`)
    
    try {
      // 执行 npm adduser，通过 stdin 提供输入
      const { spawn } = await import('child_process')
      
      // 构建命令参数
      const args = ['adduser', '--registry', registryUrl]
      
      // 对于较新版本的 npm，可以使用 --scope 和 --auth-type 参数
      // 但为了兼容性，我们使用基本参数
      
      const npmProcess = spawn('npm', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: {
          ...process.env,
          // 设置非交互式环境变量
          CI: 'true',
          // 禁用 npm 的进度条
          NPM_CONFIG_PROGRESS: 'false',
          NPM_CONFIG_LOGLEVEL: 'warn',
          // 禁用 npm 的更新检查
          NPM_CONFIG_UPDATE_NOTIFIER: 'false',
        },
      })
      
      return new Promise((resolve, reject) => {
        let stdout = ''
        let stderr = ''
        let resolved = false
        let inputSent = false
        let promptDetected = false
        
        // 设置超时（90秒，因为创建用户可能需要更长时间）
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true
            if (npmProcess && !npmProcess.killed) {
              npmProcess.kill('SIGTERM')
              // 如果 SIGTERM 无效，强制终止
              setTimeout(() => {
                if (npmProcess && !npmProcess.killed) {
                  npmProcess.kill('SIGKILL')
                }
              }, 2000)
            }
            reject(new Error('npm adduser 超时（90秒），请检查网络连接和 Verdaccio 服务状态'))
          }
        }, 90000)
        
        // 检测提示信息的函数
        const detectPrompt = (output: string): boolean => {
          const lowerOutput = output.toLowerCase()
          return (
            lowerOutput.includes('username:') ||
            lowerOutput.includes('user name:') ||
            lowerOutput.includes('npm notice log in') ||
            lowerOutput.includes('log in') ||
            lowerOutput.includes('enter username') ||
            lowerOutput.includes('npm adduser') ||
            lowerOutput.includes('registry:')
          )
        }
        
        // 发送输入的函数
        const sendInput = () => {
          if (!inputSent && npmProcess.stdin && !npmProcess.stdin.destroyed) {
            inputSent = true
            this.logger.debug(`[Verdaccio] 发送用户输入到 npm adduser`)
            try {
              npmProcess.stdin.write(adduserInput)
              npmProcess.stdin.end()
            } catch (writeError: any) {
              this.logger.error(`[Verdaccio] 写入 stdin 失败: ${writeError.message}`)
            }
          }
        }
        
        npmProcess.stdout?.on('data', (data) => {
          const output = data.toString()
          stdout += output
          this.logger.debug(`[Verdaccio] npm adduser stdout: ${output}`)
          
          // 检测提示信息，适时发送输入
          if (!inputSent && detectPrompt(output)) {
            promptDetected = true
            // 延迟发送，确保提示信息完全显示
            setTimeout(() => {
              sendInput()
            }, 300)
          }
        })
        
        npmProcess.stderr?.on('data', (data) => {
          const output = data.toString()
          stderr += output
          this.logger.debug(`[Verdaccio] npm adduser stderr: ${output}`)
          
          // 检测提示信息，适时发送输入
          if (!inputSent && detectPrompt(output)) {
            promptDetected = true
            // 延迟发送，确保提示信息完全显示
            setTimeout(() => {
              sendInput()
            }, 300)
          }
          
          // 检测错误信息
          const lowerOutput = output.toLowerCase()
          if (lowerOutput.includes('user already exists') || lowerOutput.includes('409')) {
            resolved = true
            clearTimeout(timeout)
            reject(new Error(`用户 "${username}" 已存在`))
          } else if (lowerOutput.includes('unauthorized') || lowerOutput.includes('401')) {
            resolved = true
            clearTimeout(timeout)
            reject(new Error('认证失败，请检查用户名和密码'))
          } else if (lowerOutput.includes('bad request') || lowerOutput.includes('400')) {
            resolved = true
            clearTimeout(timeout)
            reject(new Error('请求参数错误，请检查用户名、密码和邮箱格式'))
          }
        })
        
        npmProcess.on('exit', (code, signal) => {
          clearTimeout(timeout)
          if (resolved) {
            return
          }
          resolved = true
          
          if (code === 0) {
            this.logger.log(`[Verdaccio] npm adduser 创建用户成功`)
            resolve()
          } else {
            // 如果进程被信号终止，可能是超时或其他原因
            if (signal) {
              const errorMsg = `npm adduser 被信号终止: ${signal}`
              this.logger.error(`[Verdaccio] ${errorMsg}`)
              reject(new Error(errorMsg))
            } else {
              // 检查是否是用户已存在的错误
              const combinedOutput = (stderr + stdout).toLowerCase()
              if (combinedOutput.includes('user already exists') || combinedOutput.includes('409')) {
                reject(new Error(`❌ 用户 "${username}" 已存在！\n\n请使用其他用户名，或直接使用该账号登录。`))
              } else if (combinedOutput.includes('unauthorized') || combinedOutput.includes('401')) {
                reject(new Error('认证失败，请检查用户名和密码'))
              } else {
                const errorMsg = stderr || stdout || `npm adduser 失败，退出码: ${code}`
                this.logger.error(`[Verdaccio] npm adduser 失败: ${errorMsg}`)
                
                // 如果错误信息包含 "Exit handler never called"，提供更友好的错误信息
                if (errorMsg.includes('Exit handler never called') || errorMsg.includes('EPIPE')) {
                  reject(new Error('npm adduser 执行异常，这可能是 npm 版本问题。请确保 npm 版本 >= 6.0.0，或手动执行: npm adduser --registry=' + registryUrl))
                } else if (!promptDetected && code !== 0) {
                  reject(new Error(`npm adduser 失败: 未检测到提示信息，可能是 npm 版本不兼容。退出码: ${code}，错误: ${errorMsg}`))
                } else {
                  reject(new Error(`npm adduser 失败: ${errorMsg}`))
                }
              }
            }
          }
        })
        
        npmProcess.on('error', (error) => {
          clearTimeout(timeout)
          if (resolved) {
            return
          }
          resolved = true
          this.logger.error(`[Verdaccio] npm adduser 进程错误: ${error.message}`)
          reject(new Error(`npm adduser 进程错误: ${error.message}。请确保 npm 已正确安装`))
        })
        
        // 延迟发送输入，等待进程启动并显示提示
        // 如果 3 秒后还没有检测到提示，直接发送输入（兼容某些 npm 版本）
        setTimeout(() => {
          if (!inputSent) {
            this.logger.debug(`[Verdaccio] 超时未检测到提示，直接发送输入`)
            sendInput()
          }
        }, 3000)
      })
    } catch (error: any) {
      this.logger.error(`[Verdaccio] npm adduser 执行失败: ${error.message}`)
      throw error
    }
  }
  
  /**
   * 通过 Verdaccio HTTP API 创建用户
   * 使用标准的 npm registry API: PUT /-/user/org.couchdb.user:username
   * 
   * 这是最稳妥的方式，完全使用 HTTP API，不依赖 npm 命令
   */
  private async createUserWithVerdaccioApi(registryUrl: string, username: string, password: string, email: string): Promise<void> {
    const { URL } = await import('url')
    const https = await import('https')
    const http = await import('http')
    
    const url = new URL(registryUrl.replace(/\/$/, ''))
    const client = url.protocol === 'https:' ? https : http
    
    // npm 标准用户创建 API: PUT /-/user/org.couchdb.user:username
    // 这个端点在用户不存在时创建用户，在用户已存在时返回 409
    // 根据 npm registry 标准，需要包含 name, password, email, type, _id, roles, date 字段
    const userEmail = email || `${username}@example.com`
    const userPayload = {
      name: username,
      password,
      email: userEmail,
      type: 'user', // npm registry 标准字段
      _id: `org.couchdb.user:${username}`,
      roles: [] as string[],
      date: new Date().toISOString(),
    }
    const userData = JSON.stringify(userPayload)
    
    const apiPath = `/-/user/org.couchdb.user:${encodeURIComponent(username)}`
    const port = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80)
    const fullUrl = `${url.protocol}//${url.hostname}:${port}${apiPath}`
    
    this.logger.log(`[Verdaccio] API 请求: PUT ${fullUrl}`)
    this.logger.debug(`[Verdaccio] 请求数据: ${JSON.stringify({ ...userPayload, password: '***' })}`)
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port,
        path: apiPath,
        method: 'PUT',
        timeout: 10000, // 10 秒超时
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(userData),
          'User-Agent': 'LDesign-NPM-Manager/1.0',
          'Accept': 'application/json',
        },
        rejectUnauthorized: false, // 允许自签名证书
      }
      
      const req = client.request(options, (res) => {
        let data = ''
        
        res.on('data', (chunk) => {
          data += chunk.toString()
        })
        
        res.on('end', () => {
          this.logger.log(`[Verdaccio] 响应状态: ${res.statusCode}`)
          this.logger.debug(`[Verdaccio] 响应内容: ${data}`)
          
          // 201 表示用户创建成功
          if (res.statusCode === 201) {
            this.logger.log(`[Verdaccio] ✅ 用户创建成功: ${username}`)
            resolve()
            return
          }
          
          // 409 表示用户已存在
          if (res.statusCode === 409) {
            let errorMsg = '用户已存在'
            if (data) {
              try {
                const parsed = JSON.parse(data)
                errorMsg = parsed.error || errorMsg
              } catch (e) {
                // 解析失败，使用默认消息
              }
            }
            this.logger.warn(`[Verdaccio] 用户已存在: ${errorMsg}`)
            reject(new Error(`❌ 用户 "${username}" 已存在！\n\n请使用其他用户名，或直接使用该账号登录。`))
            return
          }
          
          // 400 表示请求参数不符合要求（密码策略等）
          if (res.statusCode === 400) {
            let errorMsg = '密码不符合仓库策略要求'
            try {
              const parsed = JSON.parse(data)
              errorMsg = parsed.error || errorMsg
            } catch (e) {
              // ignore
            }
            this.logger.warn(`[Verdaccio] 密码校验失败: ${errorMsg}`)
            reject(new Error(`❌ 密码不符合 Verdaccio 密码策略。\n\n原因：${errorMsg}\n\n请确保密码满足以下要求：\n• 至少 6 个字符\n• 包含字母和数字，必要时包含特殊字符\n\n调整密码后再试一次。`))
            return
          }
          
          // 403 表示用户注册被禁用
          if (res.statusCode === 403) {
            const errorMsg = data || '访问被拒绝'
            this.logger.error(`[Verdaccio] 用户注册被禁用: ${errorMsg}`)
            reject(new Error(`访问被拒绝 (403)：用户注册可能被禁用。请检查 Verdaccio 配置文件中的 auth 设置。`))
            return
          }
          
          // 401 表示认证失败
          if (res.statusCode === 401) {
            const errorMsg = data || '认证失败'
            this.logger.error(`[Verdaccio] 认证失败: ${errorMsg}`)
            reject(new Error(`认证失败 (401)：请检查 Verdaccio 配置。`))
            return
          }
          
          // 404 表示接口不存在
          if (res.statusCode === 404) {
            this.logger.error(`[Verdaccio] 接口不存在 (404)`)
            reject(new Error(`接口不存在 (404)：Verdaccio 可能不支持此 API 或版本不兼容。请检查 Verdaccio 版本。`))
            return
          }
          
          // 其他错误
          const errorMessage = data || `HTTP ${res.statusCode}`
          this.logger.error(`[Verdaccio] 创建用户失败: HTTP ${res.statusCode} - ${errorMessage}`)
          reject(new Error(`创建用户失败: HTTP ${res.statusCode} - ${errorMessage}`))
        })
      })
      
      req.on('error', (error: any) => {
        this.logger.error(`[Verdaccio] 请求错误: ${error.message} (${error.code})`)
        
        // 根据错误代码提供明确的错误信息
        if (error.code === 'ECONNREFUSED') {
          reject(new Error(`无法连接到 Verdaccio 服务 (${url.hostname}:${port})。请确保 Verdaccio 服务正在运行。`))
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
          reject(new Error(`连接 Verdaccio 服务超时 (${url.hostname}:${port})。请检查网络连接和服务状态。`))
        } else if (error.code === 'ENOTFOUND') {
          reject(new Error(`无法解析 Verdaccio 服务地址 (${url.hostname})。请检查 URL 是否正确。`))
        } else {
          reject(new Error(`创建用户请求失败: ${error.message} (${error.code})`))
        }
      })
      
      req.on('timeout', () => {
        req.destroy()
        this.logger.error(`[Verdaccio] 请求超时`)
        reject(new Error(`创建用户请求超时 (10秒)。请检查 Verdaccio 服务是否正常运行。`))
      })
      
      req.write(userData)
      req.end()
    })
  }

  /**
   * 使用 npm login 命令登录（适用于已存在的用户）
   */
  private async loginWithNpmCommand(registryUrl: string, username: string, password: string, email: string): Promise<void> {
    // 使用 npm-cli-login 或直接调用 npm login
    // 注意：npm login 是交互式命令，我们需要使用非交互式方式
    // 对于 Verdaccio，我们可以先写入 _auth，然后验证
    
    // 先写入 _auth 到 .npmrc
    const registryHost = new URL(registryUrl).hostname
    const authString = Buffer.from(`${username}:${password}`).toString('base64')
    
    let content = await this.readNpmrc()
    const lines = content.split('\n').filter(line => line.trim() !== '')
    
    // 移除旧的认证配置
    const authPatterns = [
      `//${registryHost}/:_authToken=`,
      `//${registryHost}/:_auth=`,
      `//${registryHost}/:_password=`,
      `//${registryHost}/:username=`,
      `//${registryHost}/:email=`,
      `//${registryHost}/:always-auth=`,
    ]
    
    lines.forEach((line, index) => {
      if (authPatterns.some(pattern => line.includes(pattern))) {
        lines[index] = ''
      }
    })
    
    // 添加新的认证配置
    const newLines = [
      `//${registryHost}/:_auth=${authString}`,
      `//${registryHost}/:always-auth=true`,
    ]
    
    if (email) {
      newLines.push(`//${registryHost}/:email=${email}`)
    }
    
    const filteredLines = lines.filter(line => line.trim() !== '')
    const finalContent = [...filteredLines, ...newLines].join('\n') + '\n'
    
    await this.writeNpmrc(finalContent)
    this.logger.log(`[NPM Login] 已写入 _auth 到 .npmrc: ${registryHost}`)
    
    // 验证登录状态
    const { stdout: whoamiOutput, stderr: whoamiError } = await execAsync(
      `npm whoami --registry=${registryUrl}`,
      { timeout: 10000 }
    )
    
    const whoamiUsername = whoamiOutput.trim()
    if (!whoamiUsername) {
      if (whoamiError && whoamiError.trim()) {
        throw new Error(`npm whoami 失败: ${whoamiError.trim()}`)
      }
      throw new Error('npm whoami 返回空结果，登录可能失败')
    }
    
    this.logger.log(`[NPM Login] npm whoami 验证成功: ${whoamiUsername}`)
  }

  /**
   * 通过 Verdaccio API 登录（使用标准的 npm registry API）
   * API: PUT /-/user/org.couchdb.user:username
   * 
   * 行为说明：
   * - 用户不存在 + 正确密码 → 201 + token（创建用户）
   * - 用户已存在 + 正确密码 → 200/201 + token（登录成功）
   * - 用户已存在 + 错误密码 → 409/401（登录失败）
   * 
   * 注意：Verdaccio 在某些版本中，即使用户已存在且密码正确，也可能返回 409
   * 这种情况下，需要检查响应中是否包含 token
   */
  private async loginWithVerdaccioLegacyApi(registryUrl: string, username: string, password: string, email?: string): Promise<string> {
    const { URL } = await import('url')
    const https = await import('https')
    const http = await import('http')
    
    const url = new URL(registryUrl.replace(/\/$/, ''))
    const client = url.protocol === 'https:' ? https : http
    
    // 标准的 npm registry API: PUT /-/user/org.couchdb.user:username
    // 这个 API 既可以创建用户，也可以登录已存在的用户
    // 根据 npm registry 标准，需要包含 name, password, email, type, _id, roles, date 字段
    const loginEmail = email || `${username}@example.com`
    const loginPayload = {
      name: username,
      password,
      email: loginEmail,
      type: 'user', // npm registry 标准字段
      _id: `org.couchdb.user:${username}`,
      roles: [] as string[],
      date: new Date().toISOString(),
    }
    const loginData = JSON.stringify(loginPayload)
    
    const apiPath = `/-/user/org.couchdb.user:${encodeURIComponent(username)}`
    const port = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80)
    const fullUrl = `${url.protocol}//${url.hostname}:${port}${apiPath}`
    
    this.logger.log(`[NPM Login] Verdaccio API 登录: PUT ${fullUrl}`)
    this.logger.debug(`[NPM Login] 请求数据: ${JSON.stringify({ ...loginPayload, password: '***' })}`)
    
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: url.hostname,
        port,
        path: apiPath,
        method: 'PUT',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(loginData),
          'User-Agent': 'LDesign-NPM-Manager/1.0',
          'Accept': 'application/json',
        },
        rejectUnauthorized: false, // 允许自签名证书
      }
      
      const req = client.request(requestOptions, (res) => {
        let data = ''
        
        res.on('data', (chunk) => {
          data += chunk.toString()
        })
        
        res.on('end', () => {
          this.logger.log(`[NPM Login] Verdaccio API 响应状态: ${res.statusCode}`)
          this.logger.debug(`[NPM Login] Verdaccio API 响应内容: ${data}`)
          
          // 200/201 表示登录成功（用户已存在且密码正确，或新用户创建成功）
          if (res.statusCode === 201 || res.statusCode === 200) {
            try {
              const response = JSON.parse(data)
              const token = response.token
              
              if (token) {
                this.logger.log(`[NPM Login] ✅ Verdaccio API 登录成功，获取到 token`)
                resolve(token)
              } else {
                this.logger.error(`[NPM Login] 响应中未找到 token，响应: ${JSON.stringify(response)}`)
                reject(new Error('登录成功，但响应中未找到 token'))
              }
            } catch (parseError: any) {
              this.logger.error(`[NPM Login] 解析响应失败: ${parseError.message}，原始响应: ${data}`)
              reject(new Error(`解析登录响应失败: ${parseError.message}`))
            }
          } else if (res.statusCode === 409) {
            // 409 表示用户已存在
            // 注意：某些 Verdaccio 版本即使用户已存在且密码正确，也可能返回 409
            // 但响应中可能包含 token，需要检查
            try {
              const errorResponse = JSON.parse(data)
              const errorMsg = errorResponse.error || '用户已存在'
              
              // 检查响应中是否包含 token（某些 Verdaccio 版本的特殊行为）
              if (errorResponse.token) {
                this.logger.log(`[NPM Login] ✅ Verdaccio API 登录成功（409 但包含 token）`)
                resolve(errorResponse.token)
                return
              }
              
              // 如果没有 token，说明密码错误
              this.logger.error(`[NPM Login] 密码错误 (409): ${errorMsg}`)
              this.logger.error(`[NPM Login] 响应内容: ${data}`)
              reject(new Error(`密码错误：用户已存在，但密码不正确。\n\n错误信息: ${errorMsg}\n\n请确认：\n1. 创建用户和登录使用的是同一个密码\n2. 密码中是否有特殊字符（可能需要转义）\n3. 密码是否正确输入`))
            } catch (e) {
              // 解析失败，但 409 通常表示密码错误
              this.logger.error(`[NPM Login] 密码错误 (409): 无法解析响应`)
              reject(new Error('密码错误：用户已存在，但密码不正确。请检查密码是否正确。'))
            }
          } else if (res.statusCode === 401) {
            // 401 表示认证失败
            const errorMsg = data || '认证失败'
            this.logger.error(`[NPM Login] 认证失败 (401): ${errorMsg}`)
            reject(new Error('密码错误：用户名或密码不正确，请检查登录凭据'))
          } else if (res.statusCode === 403) {
            const errorMsg = data || '访问被拒绝'
            this.logger.error(`[NPM Login] 访问被拒绝 (403): ${errorMsg}`)
            reject(new Error('访问被拒绝：可能是权限不足或配置问题'))
          } else {
            const errorMessage = data || `HTTP ${res.statusCode}`
            this.logger.error(`[NPM Login] 登录失败: HTTP ${res.statusCode} - ${errorMessage}`)
            reject(new Error(`登录失败: HTTP ${res.statusCode} - ${errorMessage}`))
          }
        })
      })
      
      req.on('error', (error: Error) => {
        this.logger.error(`[NPM Login] 请求错误: ${error.message} (${(error as any).code})`)
        reject(new Error(`登录请求失败: ${error.message}`))
      })
      
      req.on('timeout', () => {
        req.destroy()
        this.logger.error('[NPM Login] 请求超时')
        reject(new Error('登录请求超时'))
      })
      
      req.write(loginData)
      req.end()
    })
  }

  /**
   * 通过 Basic Auth 验证 Verdaccio 用户凭据
   */
  private async verifyVerdaccioCredentials(registryUrl: string, username: string, password: string): Promise<boolean> {
    const { URL } = await import('url')
    const https = await import('https')
    const http = await import('http')
    
    const url = new URL(registryUrl.replace(/\/$/, ''))
    const client = url.protocol === 'https:' ? https : http
    
    const authString = Buffer.from(`${username}:${password}`).toString('base64')
    const apiPath = '/-/whoami'
    const port = url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80)
    const fullUrl = `${url.protocol}//${url.hostname}:${port}${apiPath}`
    
    this.logger.log(`[NPM Login] 发起 Verdaccio whoami 验证: GET ${fullUrl}`)
    
    return new Promise((resolve) => {
      const requestOptions = {
        hostname: url.hostname,
        port,
        path: apiPath,
        method: 'GET',
        timeout: 5000,
        headers: {
          Authorization: `Basic ${authString}`,
          'User-Agent': 'LDesign-NPM-Manager/1.0',
          Accept: 'application/json',
        },
        rejectUnauthorized: false,
      }
      
      const req = client.request(requestOptions, (res) => {
        let data = ''
        
        res.on('data', (chunk) => {
          data += chunk.toString()
        })
        
        res.on('end', () => {
          this.logger.log(`[NPM Login] whoami 响应状态: ${res.statusCode}`)
          this.logger.debug(`[NPM Login] whoami 响应内容: ${data}`)
          
          if (res.statusCode === 200) {
            resolve(true)
          } else {
            resolve(false)
          }
        })
      })
      
      req.on('error', (error: Error) => {
        this.logger.error(`[NPM Login] whoami 请求错误: ${error.message}`)
        resolve(false)
      })
      
      req.on('timeout', () => {
        req.destroy()
        this.logger.error('[NPM Login] whoami 请求超时')
        resolve(false)
      })
      
      req.end()
    })
  }

  /**
   * 更新 .npmrc 中的认证信息（支持 Token 和 _auth 两种方式）
   */
  private async updateNpmrcAuth(
    registryUrl: string, 
    username: string, 
    password: string, 
    email?: string,
    token?: string
  ): Promise<void> {
    try {
      // 确保 URL 格式正确
      let url: URL
      try {
        url = new URL(registryUrl)
      } catch (urlError: any) {
        throw new Error(`无效的 NPM 源地址: ${registryUrl}。错误: ${urlError.message}`)
      }
      
      const registryHost = url.host
    let content = await this.readNpmrc()
    const lines = content.split('\n').filter(line => line.trim() !== '')
    
    // 移除旧的认证配置
    const authPatterns = [
      `//${registryHost}/:_authToken=`,
      `//${registryHost}/:_auth=`,
      `//${registryHost}/:_password=`,
      `//${registryHost}/:username=`,
      `//${registryHost}/:email=`,
      `//${registryHost}/:always-auth=`,
    ]
    
    lines.forEach((line, index) => {
      if (authPatterns.some(pattern => line.includes(pattern))) {
        lines[index] = ''
      }
    })
    
    // 添加新的认证配置
    const newLines: string[] = []
    
    if (token) {
      // 使用 Token 认证（Verdaccio 等支持 token 的私有源）
      newLines.push(`//${registryHost}/:_authToken=${token}`)
    } else {
      // 使用 Basic Auth（写入用户名和密码）
      const passwordBase64 = Buffer.from(password).toString('base64')
      const authString = Buffer.from(`${username}:${password}`).toString('base64')
      newLines.push(`//${registryHost}/:_auth=${authString}`)
      newLines.push(`//${registryHost}/:_password=${passwordBase64}`)
      newLines.push(`//${registryHost}/:username=${username}`)
      if (email) {
        newLines.push(`//${registryHost}/:email=${email}`)
      }
    }
    
    newLines.push(`//${registryHost}/:always-auth=true`)
    
    // 也设置全局 always-auth 和 auth-type=legacy
    const globalAlwaysAuth = 'always-auth=true'
    if (!lines.some(line => line.trim().startsWith('always-auth'))) {
      newLines.push(globalAlwaysAuth)
    }
    
    const globalAuthType = 'auth-type=legacy'
    if (!lines.some(line => line.trim().startsWith('auth-type'))) {
      newLines.push(globalAuthType)
    }
    
    // 合并内容
    const filteredLines = lines.filter(line => {
      const trimmed = line.trim()
      return trimmed !== '' && !trimmed.startsWith('always-auth') && !trimmed.startsWith('auth-type')
    })
    const finalContent = [...filteredLines, ...newLines].join('\n') + '\n'
    
    await this.writeNpmrc(finalContent)
    this.logger.log(`[NPM Login] 已更新 .npmrc 认证信息: ${registryHost} (${token ? 'Token' : '_auth'})`)
    } catch (error: any) {
      this.logger.error(`[NPM Login] 更新 .npmrc 认证信息失败: ${error.message}`)
      this.logger.error(`[NPM Login] 错误堆栈: ${error.stack || '无堆栈信息'}`)
      throw new Error(`更新认证配置失败: ${error.message}`)
    }
  }

  /**
   * NPM 登录（智能检测源类型，支持多种登录方式）
   */
  async login(loginDto: NpmLoginDto): Promise<{ success: boolean; username?: string; email?: string }> {
    let registry: NpmRegistry | null = null
    
    try {
      // 获取仓库配置
      registry = await this.findOne(loginDto.registryId)
      
      if (!registry) {
        throw new Error(`未找到 NPM 源配置: ${loginDto.registryId}`)
      }
      
      if (!registry.registry) {
        throw new Error(`NPM 源地址为空: ${loginDto.registryId}`)
      }
      
      this.logger.log(`[NPM Login] 开始登录: ${loginDto.username} @ ${registry.registry}`)
      
      // 设置 npm registry
      try {
        await execAsync(`npm config set registry ${registry.registry}`)
      } catch (configError: any) {
        this.logger.warn(`[NPM Login] 设置 registry 失败（可忽略）: ${configError.message}`)
      }
      
      const email = loginDto.email || `${loginDto.username}@example.com`
      let token: string | undefined
      let loginMethod = 'unknown'
      
      // 检测源类型并选择合适的登录方式
      try {
        const registryType = await this.detectRegistryType(registry.registry)
        this.logger.log(`[NPM Login] 检测到源类型: ${registryType}`)
        
        if (registryType === 'verdaccio') {
          // Verdaccio 私有源：先通过 Basic Auth 验证用户名密码
          this.logger.log(`[NPM Login] Verdaccio 私有源，使用 Basic Auth 验证...`)
          
          const isValid = await this.verifyVerdaccioCredentials(registry.registry, loginDto.username, loginDto.password)
          if (!isValid) {
            throw new Error('密码错误：用户名或密码不正确，请检查登录凭据')
          }
          
          loginMethod = 'verdaccio-basic'
          this.logger.log(`[NPM Login] ✅ Verdaccio Basic Auth 验证成功`)
        } else {
          // npm 官方源或其他：使用传统 _auth 方式
          loginMethod = 'npmjs-auth'
        }
      } catch (detectError: any) {
        this.logger.warn(`[NPM Login] 源类型检测失败: ${detectError.message}，使用传统方式`)
        loginMethod = 'fallback-auth'
      }
      
      // 更新 .npmrc 认证信息
      try {
        await this.updateNpmrcAuth(registry.registry, loginDto.username, loginDto.password, email, token)
      } catch (updateError: any) {
        this.logger.error(`[NPM Login] 更新 .npmrc 失败: ${updateError.message}`)
        throw new Error(`更新认证配置失败: ${updateError.message}`)
      }
      
      // 如果是 Basic Auth 验证，直接视为登录成功
      if (loginMethod === 'verdaccio-basic') {
        registry.isLoggedIn = true
        registry.username = loginDto.username
        registry.email = email
        await this.npmRegistryRepository.save(registry)
        
        this.logger.log('[NPM Login] 登录成功（Verdaccio Basic Auth 验证）')
        return {
          success: true,
          username: loginDto.username,
          email,
        }
      }
      
      // 验证登录状态（使用 npm whoami）
      try {
        // 等待一下让配置生效
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const { stdout: whoamiOutput, stderr: whoamiError } = await execAsync(
          `npm whoami --registry=${registry.registry}`,
          { timeout: 10000, encoding: 'utf8' }
        )
        const username = whoamiOutput.trim()

        if (!username) {
          // 检查是否有错误输出
          if (whoamiError && whoamiError.trim()) {
            // 对于 Verdaccio，如果 whoami 失败，可能是认证方式不对
            // 检查是否是密码错误
            const errorMsg = whoamiError.trim().toLowerCase()
            if (errorMsg.includes('unauthorized') || errorMsg.includes('authentication') || errorMsg.includes('password')) {
              throw new Error('密码错误：请检查密码是否正确。如果密码包含特殊字符，请确保输入正确。')
            }
            // 创建错误对象，包含 stderr
            const error = new Error(`npm whoami 失败: ${whoamiError.trim()}`)
            ;(error as any).stderr = whoamiError.trim()
            throw error
          }
          throw new Error('npm whoami 返回空结果，可能未登录成功')
        }

        // 对于 Verdaccio，用户名可能不完全匹配（大小写等），只检查是否返回了用户名
        if (loginMethod === 'verdaccio-api') {
          // Verdaccio 允许用户名不完全匹配
          this.logger.log(`[NPM Login] 验证成功: ${username} (期望: ${loginDto.username})`)
        } else {
          // npm 官方源需要严格匹配
          if (username !== loginDto.username) {
            throw new Error(`用户名不匹配: 期望 ${loginDto.username}, 实际 ${username}`)
          }
        }

        // 获取用户信息（可能失败，但不影响登录）
        let userEmail: string | null = null
        try {
          const { stdout: profileOutput } = await execAsync(`npm profile get --registry=${registry.registry}`, { timeout: 5000 })
          const profile = JSON.parse(profileOutput)
          userEmail = profile.email || email || null
        } catch (profileError: any) {
          this.logger.debug(`[NPM Login] 获取用户信息失败（可忽略）: ${profileError.message}`)
          userEmail = email
        }

        // 更新数据库中的登录状态
        registry.isLoggedIn = true
        registry.username = username
        registry.email = userEmail
        await this.npmRegistryRepository.save(registry)

        this.logger.log(`[NPM Login] 登录成功: ${username} @ ${registry.registry} (方式: ${loginMethod})`)

        return {
          success: true,
          username,
          email: userEmail || undefined,
        }
      } catch (verifyError: any) {
        this.logger.error(`[NPM Login] 验证登录状态失败: ${verifyError.message}`)
        this.logger.error(`[NPM Login] 错误详情: ${verifyError.stack || JSON.stringify(verifyError)}`)
        
        // 清理认证信息
        try {
          await this.removeNpmrcAuth(registry.registry)
        } catch (cleanupError) {
          this.logger.warn(`[NPM Login] 清理认证信息失败: ${cleanupError}`)
        }
        
        // 更新登录状态为失败
        if (registry) {
          registry.isLoggedIn = false
          registry.username = null
          registry.email = null
          await this.npmRegistryRepository.save(registry)
        }
        
        // 提供更友好的错误信息
        const errorMessage = verifyError.message || '未知错误'
        const stderrMessage = (verifyError as any).stderr || ''
        const fullErrorText = `${errorMessage} ${stderrMessage}`.toLowerCase()
        
        this.logger.error(`[NPM Login] npm whoami 完整错误输出: ${stderrMessage}`)
        
        // 判断错误类型并给出明确的提示
        if (fullErrorText.includes('eneedauth') || fullErrorText.includes('need auth') || fullErrorText.includes('requires you to be logged in')) {
          // 认证失败：密码错误或未登录
          throw new Error('密码错误：请检查密码是否正确。如果密码包含特殊字符，请确保输入正确。')
        } else if (fullErrorText.includes('e401') || fullErrorText.includes('unauthorized') || fullErrorText.includes('authentication failed')) {
          // 401 未授权：用户名或密码错误
          throw new Error('认证失败：用户名或密码错误，请检查登录凭据是否正确')
        } else if (fullErrorText.includes('timeout') || fullErrorText.includes('timed out')) {
          // 超时错误
          throw new Error('登录超时：请检查网络连接是否正常，或稍后重试')
        } else if (fullErrorText.includes('econnrefused') || fullErrorText.includes('enotfound') || fullErrorText.includes('getaddrinfo')) {
          // 连接错误
          throw new Error(`无法连接到 NPM 源: ${registry.registry}，请检查源地址是否正确或服务器是否可访问`)
        } else if (fullErrorText.includes('e404') || fullErrorText.includes('not found')) {
          // 404 错误
          throw new Error(`NPM 源不存在或无法访问: ${registry.registry}，请检查源地址是否正确`)
        } else if (fullErrorText.includes('e500') || fullErrorText.includes('internal server error')) {
          // 500 服务器错误
          throw new Error(`NPM 源服务器错误: ${registry.registry}，请稍后重试或联系管理员`)
        } else {
          // 其他错误：包含详细错误信息
          const detailError = stderrMessage ? `${errorMessage}\n详细错误: ${stderrMessage}` : errorMessage
          throw new Error(`登录失败: ${detailError}`)
        }
      }
    } catch (error: any) {
      this.logger.error(`[NPM Login] 登录失败: ${error.message}`)
      this.logger.error(`[NPM Login] 错误堆栈: ${error.stack || '无堆栈信息'}`)
      
      // 清理认证信息
      if (registry) {
        try {
          await this.removeNpmrcAuth(registry.registry)
        } catch (cleanupError) {
          this.logger.warn(`[NPM Login] 清理认证信息失败: ${cleanupError}`)
        }
        
        // 更新登录状态为失败
        try {
          registry.isLoggedIn = false
          registry.username = null
          registry.email = null
          await this.npmRegistryRepository.save(registry)
        } catch (saveError) {
          this.logger.warn(`[NPM Login] 更新登录状态失败: ${saveError}`)
        }
      }
      
      // 重新抛出错误，让 controller 处理
      throw error
    }
  }

  /**
   * 移除 .npmrc 中的认证信息
   */
  private async removeNpmrcAuth(registryUrl: string): Promise<void> {
    try {
      const registryHost = new URL(registryUrl).host
      const content = await this.readNpmrc()
      const lines = content.split('\n')
      
      const filteredLines = lines.filter(line => {
        const trimmed = line.trim()
        return !trimmed.startsWith(`//${registryHost}/:_authToken=`) &&
               !trimmed.startsWith(`//${registryHost}/:_auth=`) &&
               !trimmed.startsWith(`//${registryHost}/:_password=`) &&
               !trimmed.startsWith(`//${registryHost}/:username=`) &&
               !trimmed.startsWith(`//${registryHost}/:email=`) &&
               !trimmed.startsWith(`//${registryHost}/:always-auth=`) &&
               !trimmed.startsWith('always-auth') &&
               !trimmed.startsWith('auth-type')
      })
      
      await this.writeNpmrc(filteredLines.join('\n'))
      this.logger.log(`[NPM Login] 已移除 .npmrc 认证信息: ${registryHost}`)
    } catch (error: any) {
      this.logger.warn(`[NPM Login] 移除认证信息失败: ${error.message}`)
    }
  }

  /**
   * NPM 登出
   */
  async logout(registryId: string): Promise<void> {
    const registry = await this.findOne(registryId)

    try {
      // 移除 .npmrc 中的认证信息
      await this.removeNpmrcAuth(registry.registry)
      
      // 尝试执行 npm logout（可能失败，但不影响）
      try {
        await execAsync(`npm logout --registry=${registry.registry}`)
      } catch (error) {
        this.logger.debug(`[NPM Logout] npm logout 命令执行失败（可忽略）: ${error}`)
      }
      
      // 更新数据库中的登录状态
      registry.isLoggedIn = false
      registry.username = null
      registry.email = null
      await this.npmRegistryRepository.save(registry)

      this.logger.log(`[NPM Logout] 登出成功: ${registry.registry}`)
    } catch (error: any) {
      this.logger.error(`[NPM Logout] 登出失败: ${error.message}`)
      throw new Error(`NPM 登出失败: ${error.message}`)
    }
  }

  /**
   * 检查登录状态
   */
  async checkLoginStatus(registryId: string): Promise<{ isLoggedIn: boolean; username?: string; email?: string }> {
    const registry = await this.findOne(registryId)

    if (!registry.isLoggedIn) {
      return { isLoggedIn: false }
    }

    return {
      isLoggedIn: true,
      username: registry.username || undefined,
      email: registry.email || undefined,
    }
  }

  /**
   * 获取当前登录用户发布的包列表（支持分页，使用HTTP请求替代curl提升速度）
   */
  async getPackages(
    registryId: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: NpmPackageInfoDto[]; total: number; page: number; pageSize: number; totalPages: number }> {
    const registry = await this.findOne(registryId)

    if (!registry.isLoggedIn || !registry.username) {
      throw new Error('请先登录 NPM 账户')
    }

    try {
      // 使用 Node.js 内置的 http/https 模块替代 curl，提升速度和可靠性
      const { URL } = await import('url')
      const https = await import('https')
      const http = await import('http')
      
      const registryUrl = registry.registry.replace(/\/$/, '')
      const searchUrl = `${registryUrl}/-/v1/search?text=author:${registry.username}&size=250`
      const url = new URL(searchUrl)
      
      const client = url.protocol === 'https:' ? https : http
      
      return new Promise((resolve, reject) => {
        const requestOptions = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          method: 'GET',
          timeout: 10000, // 10秒超时
          headers: {
            'User-Agent': 'LDesign-NPM-Manager/1.0',
            'Accept': 'application/json',
          },
        }
        
        const req = client.request(requestOptions, (res) => {
          let data = ''
          
          // 检查响应状态码
          if (res.statusCode && res.statusCode >= 400) {
            res.on('data', (chunk) => { data += chunk.toString() })
            res.on('end', () => {
              this.logger.error(`[NPM Packages] HTTP 错误 ${res.statusCode}: ${data.substring(0, 200)}`)
              reject(new Error(`获取包列表失败: HTTP ${res.statusCode} - ${data.substring(0, 100)}`))
            })
            return
          }
          
          res.on('data', (chunk) => {
            data += chunk.toString()
          })
          
          res.on('end', () => {
            // 检查响应内容类型
            const contentType = res.headers['content-type'] || ''
            const contentTypeStr = Array.isArray(contentType) ? contentType[0] : contentType
            
            // 如果不是 JSON 格式，记录原始响应
            if (!contentTypeStr.includes('application/json') && !contentTypeStr.includes('text/json')) {
              this.logger.warn(`[NPM Packages] 响应不是 JSON 格式: ${contentTypeStr}`)
              this.logger.debug(`[NPM Packages] 响应内容: ${data.substring(0, 500)}`)
            }
            
            try {
              // 尝试解析 JSON
              const response = JSON.parse(data)
              
              const objects: any[] = Array.isArray(response.objects) ? response.objects : []
              
              const filteredObjects = objects.filter((obj) => {
                const pkg = obj?.package
                if (!pkg) return false
                
                const maintainers = Array.isArray(pkg.maintainers) ? pkg.maintainers : []
                const isOwner = maintainers.some((m: any) => m?.name === registry.username)
                if (!isOwner) return false
                
                const npmLink: string | undefined = pkg.links?.npm
                if (npmLink) {
                  const normalizedLink = npmLink.replace(/\/+$/, '')
                  if (!normalizedLink.startsWith(registryUrl)) {
                    return false
                  }
                }
                
                return true
              })
              
              const allPackages: NpmPackageInfoDto[] = filteredObjects.map((pkg: any) => ({
                name: pkg.package.name,
                version: pkg.package.version,
                description: pkg.package.description,
                author: pkg.package.publisher?.username || pkg.package.author?.name,
                publishTime: pkg.package.date,
                latest: pkg.package.version,
              }))
              
              // 服务端分页
              const total = allPackages.length
              const totalPages = Math.ceil(total / pageSize)
              const startIndex = (page - 1) * pageSize
              const endIndex = startIndex + pageSize
              const items = allPackages.slice(startIndex, endIndex)
              
              this.logger.log(`[NPM Packages] 获取成功: ${items.length}/${total} (第${page}页)`)
              
              resolve({
                items,
                total,
                page,
                pageSize,
                totalPages,
              })
            } catch (parseError: any) {
              // 记录详细的错误信息
              this.logger.error(`[NPM Packages] 解析响应失败: ${parseError.message}`)
              this.logger.error(`[NPM Packages] 响应状态码: ${res.statusCode}`)
              this.logger.error(`[NPM Packages] 响应内容类型: ${contentTypeStr}`)
              this.logger.error(`[NPM Packages] 响应内容 (前500字符): ${data.substring(0, 500)}`)
              
              // 如果响应看起来像是错误页面，提取错误信息
              if (data.includes('error') || data.includes('Error') || data.includes('code')) {
                const errorMatch = data.match(/(error\s+code:\s*\d+|Error:\s*[^\n]+)/i)
                if (errorMatch) {
                  reject(new Error(`获取包列表失败: ${errorMatch[0]}`))
                } else {
                  reject(new Error(`获取包列表失败: 服务器返回了非 JSON 格式的响应。响应内容: ${data.substring(0, 200)}`))
                }
              } else {
                reject(new Error(`解析响应失败: ${parseError.message}。响应内容: ${data.substring(0, 200)}`))
              }
            }
          })
        })
        
        req.on('error', (error: Error) => {
          this.logger.error(`请求失败: ${error.message}`)
          reject(new Error(`获取包列表失败: ${error.message}`))
        })
        
        req.on('timeout', () => {
          req.destroy()
          this.logger.error('请求超时')
          reject(new Error('获取包列表超时，请稍后重试'))
        })
        
        req.end()
      })
    } catch (error: any) {
      this.logger.error(`获取包列表失败: ${error.message}`)
      throw new Error(`获取包列表失败: ${error.message}`)
    }
  }

  /**
   * 安装 Verdaccio（全局安装）
   */
  async installVerdaccio(): Promise<void> {
    this.logger.log('[Verdaccio] 开始安装 Verdaccio...')
    
    try {
      // 检查是否已安装
      try {
        const { stdout } = await execAsync('verdaccio --version', { 
          timeout: 5000,
          encoding: 'utf8',
        })
        const version = stdout.trim()
        this.logger.log(`[Verdaccio] Verdaccio 已安装，版本: ${version}`)
        return // 已安装，直接返回
      } catch (error: any) {
        // 未安装，继续安装流程
        this.logger.log('[Verdaccio] Verdaccio 未安装，开始安装...')
      }
      
      // 执行全局安装
      this.logger.log('[Verdaccio] 执行: npm install -g verdaccio')
      try {
        const { stdout, stderr } = await execAsync('npm install -g verdaccio', {
          timeout: 300000, // 5分钟超时
          maxBuffer: 10 * 1024 * 1024, // 10MB 缓冲区
          encoding: 'utf8',
        })
        
        // 记录安装输出
        if (stdout) {
          const outputLines = stdout.split('\n').filter(line => line.trim())
          outputLines.forEach(line => {
            this.logger.log(`[Verdaccio Install] ${line}`)
          })
        }
        
        // 处理警告和错误
        if (stderr) {
          const stderrLines = stderr.split('\n').filter(line => line.trim())
          stderrLines.forEach(line => {
            if (line.includes('npm WARN') || line.includes('npm notice')) {
              this.logger.warn(`[Verdaccio Install] ${line}`)
            } else if (line.includes('npm ERR') || line.includes('error')) {
              this.logger.error(`[Verdaccio Install] ${line}`)
              throw new Error(`安装过程中出现错误: ${line}`)
            } else {
              this.logger.log(`[Verdaccio Install] ${line}`)
            }
          })
        }
      } catch (installError: any) {
        // 解析安装错误
        let errorMessage = installError.message || '未知错误'
        
        // 尝试从 stderr 获取更多信息
        if (installError.stderr) {
          const stderrStr = typeof installError.stderr === 'string' 
            ? installError.stderr 
            : installError.stderr.toString('utf8')
          const errorLines = stderrStr.split('\n').filter(line => line.trim())
          const errorLine = errorLines.find(line => 
            line.includes('npm ERR') || 
            line.includes('error') || 
            line.includes('Error') ||
            line.includes('failed')
          )
          if (errorLine) {
            errorMessage = errorLine
          }
        }
        
        // 检查常见错误类型
        if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied') || errorMessage.includes('权限')) {
          throw new Error('安装失败：权限不足。请尝试使用管理员权限运行，或使用 npm config set prefix 配置全局安装路径')
        } else if (errorMessage.includes('ENOENT') || errorMessage.includes('not found') || errorMessage.includes('找不到')) {
          throw new Error('安装失败：npm 命令未找到。请确保 Node.js 和 npm 已正确安装并添加到 PATH 环境变量')
        } else if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
          throw new Error('安装失败：安装超时。请检查网络连接或稍后重试')
        } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('网络')) {
          throw new Error('安装失败：网络连接失败。请检查网络连接或配置 npm 代理')
        } else {
          // 清理错误消息，移除乱码
          const cleanMessage = errorMessage
            .replace(/[^\x00-\x7F]/g, '') // 移除非 ASCII 字符
            .replace(/\s+/g, ' ') // 规范化空白字符
            .trim()
          throw new Error(`安装失败：${cleanMessage || installError.message || '未知错误'}`)
        }
      }
      
      // 验证安装是否成功
      this.logger.log('[Verdaccio] 验证安装是否成功...')
      
      // 在 Windows 上，npm 全局安装后可能需要刷新 PATH
      // 尝试多种方式验证安装
      let version: string | null = null
      
      // 方法1: 直接执行 verdaccio --version
      try {
        const { stdout } = await execAsync('verdaccio --version', { 
          timeout: 5000,
          encoding: 'utf8',
        })
        version = stdout.trim()
      } catch (error: any) {
        // 方法2: 使用 npx verdaccio --version
        try {
          this.logger.log('[Verdaccio] 尝试使用 npx 执行 verdaccio...')
          const { stdout } = await execAsync('npx verdaccio --version', { 
            timeout: 5000,
            encoding: 'utf8',
          })
          version = stdout.trim()
        } catch (npxError: any) {
          // 方法3: 查找 npm 全局 bin 目录
          try {
            this.logger.log('[Verdaccio] 尝试查找 npm 全局 bin 目录...')
            const { stdout: npmPrefix } = await execAsync('npm config get prefix', {
              timeout: 5000,
              encoding: 'utf8',
            })
            const prefix = npmPrefix.trim()
            const verdaccioPath = require('path').join(prefix, process.platform === 'win32' ? 'verdaccio.cmd' : 'verdaccio')
            
            this.logger.log(`[Verdaccio] 尝试使用完整路径: ${verdaccioPath}`)
            const { stdout } = await execAsync(`"${verdaccioPath}" --version`, {
              timeout: 5000,
              encoding: 'utf8',
            })
            version = stdout.trim()
          } catch (pathError: any) {
            // 如果所有方法都失败，检查是否真的安装了
            this.logger.warn('[Verdaccio] 无法验证安装，但 npm install 已成功完成')
            this.logger.warn('[Verdaccio] 这可能是因为 PATH 环境变量未更新')
            this.logger.warn('[Verdaccio] 建议重启服务器或手动刷新环境变量')
            
            // 不抛出错误，因为安装可能已经成功，只是 PATH 未更新
            // 返回成功，让启动时再尝试
            return
          }
        }
      }
      
      if (version) {
        this.logger.log(`[Verdaccio] Verdaccio 安装成功，版本: ${version}`)
      } else {
        this.logger.warn('[Verdaccio] 无法获取版本号，但安装过程已完成')
      }
    } catch (error: any) {
      this.logger.error(`[Verdaccio] 安装失败: ${error.message}`)
      this.logger.error(`[Verdaccio] 错误堆栈: ${error.stack || '无堆栈信息'}`)
      
      // 如果错误消息已经是友好的，直接抛出
      if (error.message && (
        error.message.includes('权限') ||
        error.message.includes('npm 命令未找到') ||
        error.message.includes('超时') ||
        error.message.includes('网络')
      )) {
        throw error
      }
      
      // 提供更详细的错误信息
      let errorMessage = `安装 Verdaccio 失败: ${error.message || '未知错误'}`
      
      // 检查是否是权限问题
      if (error.message?.includes('EACCES') || error.message?.includes('permission denied')) {
        errorMessage = '安装失败：权限不足。请尝试使用管理员权限运行，或使用 npm config set prefix 配置全局安装路径'
      } else if (error.message?.includes('ENOENT') || error.message?.includes('not found')) {
        errorMessage = '安装失败：npm 命令未找到。请确保 Node.js 和 npm 已正确安装'
      } else if (error.message?.includes('timeout')) {
        errorMessage = '安装失败：安装超时。请检查网络连接或稍后重试'
      }
      
      throw new Error(errorMessage)
    }
  }

  /**
   * 启动本地 Verdaccio 服务
   */
  async startLocalVerdaccio(port?: number, registryId?: string): Promise<{ registry: NpmRegistry; port: number; url: string; logs?: string[] }> {
    const logs: string[] = []
    
    // 优先从配置文件中读取端口，如果配置文件不存在或无法解析，再使用传入的参数或默认端口
    let verdaccioPort = port || this.DEFAULT_VERDACCIO_PORT
    try {
      await fs.access(this.VERDACCIO_CONFIG_PATH)
      const configContent = await fs.readFile(this.VERDACCIO_CONFIG_PATH, 'utf-8')
      const configPort = this.parsePortFromConfig(configContent)
      if (configPort !== null) {
        verdaccioPort = configPort
        this.logger.log(`[Verdaccio] 从配置文件中读取端口: ${verdaccioPort}`)
      } else if (port) {
        // 如果配置文件存在但无法解析端口，且传入了端口参数，使用传入的端口
        verdaccioPort = port
        this.logger.log(`[Verdaccio] 使用传入的端口参数: ${verdaccioPort}`)
      }
    } catch {
      // 配置文件不存在，使用传入的端口或默认端口
      if (port) {
        verdaccioPort = port
      }
      this.logger.log(`[Verdaccio] 配置文件不存在，使用端口: ${verdaccioPort}`)
    }
    
    const addLog = (message: string) => {
      const logMessage = `[${new Date().toLocaleTimeString('zh-CN')}] ${message}`
      logs.push(logMessage)
      this.logger.log(`[Verdaccio] ${message}`)
    }
    
    try {
      // 检查 Verdaccio 是否已安装
      try {
        addLog('检查 Verdaccio 是否已安装...')
        let version: string | null = null
        
        // 方法1: 直接执行 verdaccio --version
        try {
          const { stdout } = await execAsync('verdaccio --version', { 
            timeout: 5000,
            encoding: 'utf8',
          })
          version = stdout.trim()
          addLog(`检测到 Verdaccio 版本: ${version}`)
        } catch (error: any) {
          // 方法2: 使用 npx verdaccio --version
          try {
            addLog('尝试使用 npx 执行 verdaccio...')
            const { stdout } = await execAsync('npx verdaccio --version', { 
              timeout: 5000,
              encoding: 'utf8',
            })
            version = stdout.trim()
            addLog(`检测到 Verdaccio 版本: ${version}`)
          } catch (npxError: any) {
            // 方法3: 查找 npm 全局 bin 目录
            try {
              addLog('尝试查找 npm 全局 bin 目录...')
              const { stdout: npmPrefix } = await execAsync('npm config get prefix', {
                timeout: 5000,
                encoding: 'utf8',
              })
              const prefix = npmPrefix.trim()
              const path = require('path')
              const verdaccioPath = path.join(prefix, process.platform === 'win32' ? 'verdaccio.cmd' : 'verdaccio')
              
              addLog(`尝试使用完整路径: ${verdaccioPath}`)
              const { stdout } = await execAsync(`"${verdaccioPath}" --version`, {
                timeout: 5000,
                encoding: 'utf8',
              })
              version = stdout.trim()
              addLog(`检测到 Verdaccio 版本: ${version}`)
            } catch (pathError: any) {
              // 所有方法都失败，尝试自动安装
              addLog('Verdaccio 未安装，尝试自动安装...')
              try {
                await this.installVerdaccio()
                addLog('Verdaccio 安装成功')
                // 安装后再次尝试查找
                try {
                  const { stdout: npmPrefix } = await execAsync('npm config get prefix', {
                    timeout: 5000,
                    encoding: 'utf8',
                  })
                  const prefix = npmPrefix.trim()
                  const path = require('path')
                  const verdaccioPath = path.join(prefix, process.platform === 'win32' ? 'verdaccio.cmd' : 'verdaccio')
                  const { stdout } = await execAsync(`"${verdaccioPath}" --version`, {
                    timeout: 5000,
                    encoding: 'utf8',
                  })
                  version = stdout.trim()
                  addLog(`Verdaccio 安装成功，版本: ${version}`)
                } catch (finalError: any) {
                  throw new Error('Verdaccio 安装完成，但无法验证。请重启服务器后重试')
                }
              } catch (installError: any) {
                const errorMsg = installError.message || 'Verdaccio 未安装。请先安装: npm install -g verdaccio'
                addLog(`安装失败: ${errorMsg}`)
                throw new Error(`Verdaccio 未安装。请先安装: npm install -g verdaccio`)
              }
            }
          }
        }
      } catch (error: any) {
        const errorMsg = error.message || 'Verdaccio 未安装。请先安装: npm install -g verdaccio'
        addLog(`错误: ${errorMsg}`)
        throw error
      }
    
    // 如果已有进程在运行，直接返回
    if (this.verdaccioProcess && this.verdaccioProcess.process && !this.verdaccioProcess.process.killed && !this.verdaccioProcess.isDetached) {
      addLog('Verdaccio 服务已在运行')
      const existingRegistry = await this.findOrCreateLocalVerdaccioRegistry(verdaccioPort)
      return {
        registry: existingRegistry,
        port: verdaccioPort,
        url: `http://localhost:${verdaccioPort}/`,
        logs,
      }
    }
    
    // 检查端口是否已被占用（通过尝试连接来检查）
    addLog(`检查端口 ${verdaccioPort} 是否可用...`)
    try {
      const http = await import('http')
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://localhost:${verdaccioPort}/-/ping`, (res) => {
          // 端口已被占用
          addLog(`端口 ${verdaccioPort} 已被占用，尝试停止已存在的服务...`)
          
          // 检查是否是我们管理的进程
          if (this.verdaccioProcess && this.verdaccioProcess.port === verdaccioPort) {
            addLog('检测到我们管理的 Verdaccio 服务正在运行，将先停止它')
            // 先停止旧服务
            this.stopLocalVerdaccio().then(async () => {
              addLog('旧服务已停止，等待端口释放...')
              // 等待端口释放（最多等待 10 秒）
              let portReleased = false
              for (let i = 0; i < 50; i++) {
                const isPortInUse = await this.checkVerdaccioPortRunning(verdaccioPort)
                if (!isPortInUse) {
                  portReleased = true
                  addLog(`端口 ${verdaccioPort} 已释放`)
                  break
                }
                await new Promise(resolve => setTimeout(resolve, 200))
              }
              if (!portReleased) {
                addLog(`警告: 端口 ${verdaccioPort} 可能仍被占用，尝试强制释放...`)
                await this.killVerdaccioByPort(verdaccioPort)
                await new Promise(resolve => setTimeout(resolve, 2000))
              }
              resolve()
            }).catch((stopError: any) => {
              addLog(`停止旧服务失败: ${stopError.message}`)
              reject(new Error(`端口 ${verdaccioPort} 已被占用，且无法停止旧服务。请手动停止占用该端口的进程，或使用其他端口`))
            })
          } else {
            // 不是我们管理的进程，尝试通过 API 停止（可能是之前启动的）
            addLog('尝试通过 API 停止 Verdaccio 服务...')
            const stopReq = http.request({
              hostname: 'localhost',
              port: verdaccioPort,
              path: '/-/stop',
              method: 'POST',
              timeout: 3000,
            }, async (stopRes) => {
              addLog('已发送停止请求，等待端口释放...')
              // 等待端口释放（最多等待 10 秒）
              let portReleased = false
              for (let i = 0; i < 50; i++) {
                const isPortInUse = await this.checkVerdaccioPortRunning(verdaccioPort)
                if (!isPortInUse) {
                  portReleased = true
                  addLog(`端口 ${verdaccioPort} 已释放`)
                  break
                }
                await new Promise(resolve => setTimeout(resolve, 200))
              }
              if (!portReleased) {
                addLog(`警告: 端口 ${verdaccioPort} 可能仍被占用，尝试强制释放...`)
                await this.killVerdaccioByPort(verdaccioPort)
                await new Promise(resolve => setTimeout(resolve, 2000))
              }
              resolve()
            })
            stopReq.on('error', async () => {
              // API 停止失败，尝试通过进程 ID 停止
              addLog('API 停止失败，尝试通过进程 ID 停止...')
              try {
                // 使用 killVerdaccioByPort 方法，它会处理所有情况
                await this.killVerdaccioByPort(verdaccioPort)
                addLog('进程已停止，等待端口释放...')
                // 等待端口释放（最多等待 10 秒）
                let portReleased = false
                for (let i = 0; i < 50; i++) {
                  const isPortInUse = await this.checkVerdaccioPortRunning(verdaccioPort)
                  if (!isPortInUse) {
                    portReleased = true
                    addLog(`端口 ${verdaccioPort} 已释放`)
                    break
                  }
                  await new Promise(resolve => setTimeout(resolve, 200))
                }
                if (portReleased) {
                  resolve()
                } else {
                  reject(new Error(`端口 ${verdaccioPort} 已被占用。请先点击"停止本地 Verdaccio"按钮停止服务，或手动停止占用该端口的进程`))
                }
              } catch (error: any) {
                reject(new Error(`端口 ${verdaccioPort} 已被占用。请先点击"停止本地 Verdaccio"按钮停止服务，或手动停止占用该端口的进程`))
              }
            })
            stopReq.setTimeout(3000, async () => {
              // 超时时，先检查请求是否已完成
              if (!stopReq.destroyed) {
                stopReq.destroy()
              }
              // 尝试通过进程 ID 停止
              try {
                addLog('停止请求超时，尝试通过进程 ID 停止服务...')
                await this.killVerdaccioByPort(verdaccioPort)
                addLog('已尝试通过进程 ID 停止服务，等待端口释放...')
                // 等待端口释放（最多等待 5 秒）
                let portReleased = false
                for (let i = 0; i < 25; i++) {
                  const isPortInUse = await this.checkVerdaccioPortRunning(verdaccioPort)
                  if (!isPortInUse) {
                    portReleased = true
                    addLog(`端口 ${verdaccioPort} 已释放`)
                    break
                  }
                  await new Promise(resolve => setTimeout(resolve, 200))
                }
                if (portReleased) {
                  resolve()
                } else {
                  reject(new Error(`端口 ${verdaccioPort} 已被占用。请先点击"停止本地 Verdaccio"按钮停止服务，或手动停止占用该端口的进程`))
                }
              } catch (error: any) {
                reject(new Error(`端口 ${verdaccioPort} 已被占用。请先点击"停止本地 Verdaccio"按钮停止服务，或手动停止占用该端口的进程`))
              }
            })
            stopReq.end()
          }
        })
        req.on('error', (err: any) => {
          // 连接失败说明端口未被占用，可以继续
          if (err.code === 'ECONNREFUSED') {
            resolve()
          } else if (err.code === 'ECONNRESET' || err.message?.includes('aborted')) {
            // 忽略 abort 相关的错误，端口未被占用
            resolve()
          } else {
            reject(err)
          }
        })
        req.setTimeout(2000, () => {
          // 超时时，先检查请求是否已完成
          if (!req.destroyed) {
            req.destroy()
          }
          resolve()
        })
      })
      addLog(`端口 ${verdaccioPort} 可用`)
    } catch (error: any) {
      if (error.message.includes('已被占用')) {
        addLog(`错误: ${error.message}`)
        throw error
      }
      // 其他错误忽略，继续启动
      addLog(`端口检查完成`)
    }
    
    // 创建配置目录
    addLog('创建配置目录...')
    const configDir = join(homedir(), '.ldesign', 'verdaccio')
    await fs.mkdir(configDir, { recursive: true })
    await fs.mkdir(this.VERDACCIO_STORAGE_PATH, { recursive: true })
    addLog(`配置目录已创建: ${configDir}`)
    
    // 强制创建默认管理员账户（确保 htpasswd 文件存在）
    await this.createDefaultAdminUser(configDir, addLog)
    
    // 验证 htpasswd 文件是否存在
    const htpasswdPath = join(configDir, 'htpasswd')
    try {
      const htpasswdContent = await fs.readFile(htpasswdPath, 'utf-8')
      if (htpasswdContent.includes('admin:')) {
        addLog('验证: htpasswd 文件已包含 admin 用户')
      } else {
        addLog('警告: htpasswd 文件存在但不包含 admin 用户')
      }
    } catch {
      addLog('警告: htpasswd 文件不存在，将在启动后创建')
    }
    
    // 检查配置文件是否存在，如果存在则使用现有配置，否则创建新配置
    let configExists = false
    try {
      await fs.access(this.VERDACCIO_CONFIG_PATH)
      configExists = true
      addLog(`使用现有配置文件: ${this.VERDACCIO_CONFIG_PATH}`)
      
      // 如果配置文件存在，检查端口是否一致，不一致则更新
      try {
        const existingContent = await fs.readFile(this.VERDACCIO_CONFIG_PATH, 'utf-8')
        const existingPort = this.parsePortFromConfig(existingContent)
        
        if (existingPort !== null && existingPort !== verdaccioPort) {
          addLog(`检测到端口不一致（配置: ${existingPort}, 启动: ${verdaccioPort}），更新配置文件中的端口...`)
          // 更新配置文件中的端口
          const config = yaml.load(existingContent) as any
          if (config && config.listen) {
            // 更新 listen 配置
            if (typeof config.listen === 'object' && !Array.isArray(config.listen) && config.listen.port) {
              config.listen.port = verdaccioPort
            } else if (typeof config.listen === 'string') {
              // 替换端口号
              config.listen = config.listen.replace(/:(\d+)$/, `:${verdaccioPort}`)
            } else if (Array.isArray(config.listen) && config.listen.length > 0) {
              config.listen[0] = String(config.listen[0]).replace(/:(\d+)$/, `:${verdaccioPort}`)
            }
            
            // 保存更新后的配置
            const updatedContent = yaml.dump(config, {
              indent: 2,
              lineWidth: -1,
              quotingType: '"',
              forceQuotes: false,
            })
            await fs.writeFile(this.VERDACCIO_CONFIG_PATH, updatedContent, 'utf-8')
            addLog(`配置文件端口已更新为: ${verdaccioPort}`)
          }
        } else {
          addLog(`配置文件端口正确: ${verdaccioPort}`)
        }
      } catch (parseError: any) {
        addLog(`警告: 无法解析现有配置文件，将使用默认配置: ${parseError.message}`)
        configExists = false
      }
    } catch {
      configExists = false
    }
    
    // 如果配置文件不存在，创建新配置
    if (!configExists) {
      addLog('创建 Verdaccio 配置文件...')
      // 使用 Verdaccio 6.x 兼容的最简配置格式
      const configContent = `#
# Verdaccio 配置文件
# 这是由 LDesign 自动生成的配置文件
#
storage: ${this.VERDACCIO_STORAGE_PATH.replace(/\\/g, '/')}

# 监听地址和端口
listen: 0.0.0.0:${verdaccioPort}

# Web UI 配置
web:
  title: LDesign Local Verdaccio
  gravatar: false
  scope: '@ldesign'
  sort_packages: asc

# 认证配置
auth:
  htpasswd:
    file: ${join(configDir, 'htpasswd').replace(/\\/g, '/')}
    max_users: 1000
    algorithm: bcrypt
    rounds: 10

# 上游源配置
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
    timeout: 10s

# 包访问权限配置
packages:
  '@ldesign/*':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs
  
  '**':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs

# 日志配置（Verdaccio 6.x 对象格式）
log:
  type: stdout
  format: pretty
  level: http
`
      
      await fs.writeFile(this.VERDACCIO_CONFIG_PATH, configContent, 'utf-8')
      addLog(`配置文件已创建: ${this.VERDACCIO_CONFIG_PATH}`)
    }
    
    // 启动 Verdaccio
    addLog(`正在启动 Verdaccio，端口: ${verdaccioPort}...`)
    
    // 使用 npx 启动 Verdaccio（最可靠的方法，不需要 PATH）
    // npx 会自动查找并执行 verdaccio，即使它不在 PATH 中
    addLog('使用 npx 启动 Verdaccio（独立进程模式）...')
    
    // Windows 和 Unix 平台使用不同的方式启动独立进程
    let verdaccioProcess: ChildProcess
    let actualPid: number | null = null
    
    if (process.platform === 'win32') {
      // Windows: 使用更可靠的方式启动 Verdaccio
      addLog('Windows 平台：使用后台模式启动（已设置隐藏窗口，不会弹出命令行窗口）...')
      
      // 确保配置文件路径是绝对路径，并规范化路径
      const configPath = normalize(pathResolve(this.VERDACCIO_CONFIG_PATH))
      addLog(`配置文件路径: ${configPath}`)
      
      // 验证配置文件是否存在
      try {
        await fs.access(configPath)
        addLog('配置文件存在，路径验证通过')
      } catch (error: any) {
        addLog(`警告: 配置文件不存在或无法访问: ${error.message}`)
        throw new Error(`配置文件不存在: ${configPath}`)
      }
      
      // Windows 上使用批处理脚本启动，避免路径解析问题
      // 创建临时批处理脚本，在脚本中设置工作目录并启动 verdaccio
      const configDir = normalize(pathResolve(join(homedir(), '.ldesign', 'verdaccio')))
      const batchScriptPath = join(configDir, 'start-verdaccio.bat')
      
      addLog(`配置文件目录: ${configDir}`)
      addLog(`配置文件路径: ${configPath}`)
      
      // 创建批处理脚本
      // 批处理脚本会在正确的目录下执行命令，避免路径解析问题
      const batchScriptContent = `@echo off
cd /d "${configDir}"
npx verdaccio -c "${configPath}"
`
      
      let useBatchScript = false
      try {
        await fs.writeFile(batchScriptPath, batchScriptContent, 'utf-8')
        addLog(`批处理脚本已创建: ${batchScriptPath}`)
        useBatchScript = true
      } catch (error: any) {
        addLog(`警告: 创建批处理脚本失败: ${error.message}，使用直接启动方式`)
        useBatchScript = false
      }
      
      if (useBatchScript) {
        // 使用批处理脚本启动
        addLog('使用批处理脚本启动 Verdaccio...')
        verdaccioProcess = spawn('cmd.exe', ['/c', batchScriptPath], {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: false,
          detached: false,
          windowsHide: true, // 隐藏窗口
          cwd: configDir, // 设置工作目录
          env: {
            ...process.env,
            NODE_ENV: 'production',
          },
        })
      } else {
        // 使用直接启动方式
        addLog('使用直接启动方式启动 Verdaccio...')
        verdaccioProcess = spawn('npx', ['verdaccio', '-c', configPath], {
          stdio: ['ignore', 'pipe', 'pipe'],
          shell: false,
          detached: false,
          windowsHide: true,
          cwd: configDir,
          env: {
            ...process.env,
            NODE_ENV: 'production',
          },
        })
      }
      
      actualPid = verdaccioProcess.pid || null
      addLog(`Verdaccio 进程已启动，PID: ${actualPid || 'unknown'}`)
      
      // 等待一下，然后通过端口验证进程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 通过端口查找实际进程 PID（验证）
      try {
        const { stdout } = await execAsync(`netstat -ano | findstr :${verdaccioPort} | findstr LISTENING`)
        const lines = stdout.split('\n').filter(line => line.includes('LISTENING'))
        if (lines.length > 0) {
          const match = lines[0].match(/\s+(\d+)\s*$/)
          if (match) {
            const foundPid = parseInt(match[1], 10)
            if (foundPid !== actualPid) {
              addLog(`通过端口找到的 PID (${foundPid}) 与 spawn 返回的 PID (${actualPid}) 不同，使用端口找到的 PID`)
              actualPid = foundPid
            }
          }
        }
      } catch {
        // 忽略错误，使用 spawn 返回的 PID
      }
    } else {
      // Unix/Linux/Mac: 使用 detached: true 和 unref() 实现独立进程
      addLog('Unix/Linux/Mac 平台：使用独立进程模式启动...')
      addLog(`配置文件路径: ${this.VERDACCIO_CONFIG_PATH}`)
      
      verdaccioProcess = spawn('npx', ['verdaccio', '-c', this.VERDACCIO_CONFIG_PATH], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        detached: true, // Unix 上使用 detached 实现独立进程
        cwd: process.cwd(), // 设置工作目录
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
      })
      
      // 分离进程，使其独立于父进程运行
      if (verdaccioProcess.pid) {
        verdaccioProcess.unref()
        actualPid = verdaccioProcess.pid
        addLog(`Verdaccio 进程已分离，PID: ${actualPid}`)
      }
    }
    
    if (actualPid) {
      addLog(`Verdaccio 进程 PID: ${actualPid}`)
    }
    
    // 监听输出（仅当 stdout/stderr 可用时）
    let startupOutput = ''
    let errorOutput = ''
    
    // 只有在非 PowerShell 启动方式时才监听输出
    // PowerShell 启动时 stdout/stderr 为 null，需要通过其他方式获取日志
    if (verdaccioProcess.stdout) {
      verdaccioProcess.stdout.on('data', (data) => {
        const output = data.toString('utf8')
        startupOutput += output
        const lines = output.split('\n').filter(line => line.trim())
        lines.forEach(line => {
          if (line.trim()) {
            addLog(line.trim())
          }
        })
      })
    }
    
    if (verdaccioProcess.stderr) {
      verdaccioProcess.stderr.on('data', (data) => {
        const output = data.toString('utf8')
        errorOutput += output
        startupOutput += output
        const lines = output.split('\n').filter(line => line.trim())
        lines.forEach(line => {
          if (line.trim()) {
            // 检查是否是错误信息
            const lowerLine = line.toLowerCase()
            if (lowerLine.includes('error') || lowerLine.includes('fatal') || lowerLine.includes('failed')) {
              addLog(`错误: ${line.trim()}`)
            } else {
              addLog(`警告: ${line.trim()}`)
            }
          }
        })
      })
    }
    
    // 等待服务启动（最多等待 30 秒）
    addLog('等待服务启动...')
    await new Promise<void>((resolve, reject) => {
      let resolved = false
      let rejected = false
      let exitCode: number | null = null
      let exitSignal: NodeJS.Signals | null = null
      let serviceVerified = false
      
      // 先监听退出事件，记录退出信息
      verdaccioProcess.on('exit', async (code, signal) => {
        exitCode = code
        exitSignal = signal
        
        if (resolved || serviceVerified) {
          return // 已经成功启动，忽略退出事件
        }
        
        // 检查是否是配置文件路径错误
        const isConfigPathError = errorOutput.toLowerCase().includes('config file') && 
                                  (errorOutput.toLowerCase().includes('does not exist') || 
                                   errorOutput.toLowerCase().includes('not reachable'))
        
        if (isConfigPathError && process.platform === 'win32') {
          // Windows 上环境变量方式失败，尝试使用 -c 参数方式
          addLog('环境变量方式失败，尝试使用 -c 参数方式启动...')
          
          try {
            // 停止当前进程
            if (!verdaccioProcess.killed) {
              verdaccioProcess.kill('SIGTERM')
            }
            
            // 等待进程完全退出
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // 使用 -c 参数方式重新启动
            const configPath = normalize(pathResolve(this.VERDACCIO_CONFIG_PATH))
            const configDir = normalize(pathResolve(join(homedir(), '.ldesign', 'verdaccio')))
            
            addLog(`使用 -c 参数方式启动，配置文件: ${configPath}`)
            
            // 创建新的进程，使用 -c 参数
            const newProcess = spawn('npx', ['verdaccio', '-c', configPath], {
              stdio: ['ignore', 'pipe', 'pipe'],
              shell: false,
              detached: false,
              windowsHide: true,
              cwd: configDir,
              env: {
                ...process.env,
                NODE_ENV: 'production',
              },
            })
            
            // 更新进程引用
            verdaccioProcess = newProcess
            actualPid = newProcess.pid || null
            
            // 重新设置输出监听
            let newStartupOutput = ''
            let newErrorOutput = ''
            
            if (newProcess.stdout) {
              newProcess.stdout.on('data', (data) => {
                const output = data.toString('utf8')
                newStartupOutput += output
                startupOutput += output
                const lines = output.split('\n').filter(line => line.trim())
                lines.forEach(line => {
                  if (line.trim()) {
                    addLog(line.trim())
                  }
                })
              })
            }
            
            if (newProcess.stderr) {
              newProcess.stderr.on('data', (data) => {
                const output = data.toString('utf8')
                newErrorOutput += output
                errorOutput += output
                startupOutput += output
                const lines = output.split('\n').filter(line => line.trim())
                lines.forEach(line => {
                  if (line.trim()) {
                    const lowerLine = line.toLowerCase()
                    if (lowerLine.includes('error') || lowerLine.includes('fatal') || lowerLine.includes('failed')) {
                      addLog(`错误: ${line.trim()}`)
                    } else {
                      addLog(`警告: ${line.trim()}`)
                    }
                  }
                })
              })
            }
            
            // 等待服务启动
            await new Promise(resolve => setTimeout(resolve, 3000))
            
            // 验证服务是否启动
            const http = await import('http')
            const verifyReq = http.get(`http://localhost:${verdaccioPort}/-/ping`, (res: any) => {
              if (res.statusCode === 200) {
                serviceVerified = true
                resolved = true
                clearTimeout(timeout)
                clearInterval(checkInterval)
                addLog('使用 -c 参数方式启动成功')
                resolve()
              } else {
                addLog(`服务验证失败: HTTP ${res.statusCode}`)
              }
            })
            
            verifyReq.on('error', () => {
              addLog('服务验证失败: 连接错误')
            })
            
            verifyReq.setTimeout(5000, () => {
              if (!verifyReq.destroyed) {
                verifyReq.destroy()
              }
            })
            
            return // 不继续处理原来的退出事件
          } catch (retryError: any) {
            addLog(`使用 -c 参数方式启动失败: ${retryError.message}`)
            // 继续处理原来的退出事件
          }
        }
        
        // 如果进程退出，但输出中显示服务已启动，尝试验证服务
        const hasStarted = startupOutput.toLowerCase().includes('http address') || 
                           (startupOutput.toLowerCase().includes('verdaccio/') && startupOutput.toLowerCase().includes('http://'))
        
        if (hasStarted) {
          // 即使退出码是 2（警告），如果服务已启动，尝试验证
          addLog('检测到服务可能已启动，验证服务状态...')
          // 使用动态导入，因为这是在事件处理器中
          import('http').then((http) => {
            const verifyReq = http.get(`http://localhost:${verdaccioPort}/-/ping`, (res: any) => {
            if (res.statusCode === 200) {
              // 服务实际上已经启动
              serviceVerified = true
              resolved = true
              clearTimeout(timeout)
              clearInterval(checkInterval)
              addLog('服务验证成功（虽然有警告）')
              resolve()
              return
            }
          })
          verifyReq.on('error', (err: any) => {
            // 验证失败，继续处理退出事件
            // 忽略 abort 相关的错误
            if (err.code === 'ECONNRESET' || err.message?.includes('aborted')) {
              // 如果是 abort 错误，忽略它，继续处理退出事件
              return
            }
            
            if (!rejected) {
              rejected = true
              clearTimeout(timeout)
              clearInterval(checkInterval)
              
              let errorMessage = 'Verdaccio 进程退出，且服务未响应'
              if (exitCode !== 0 && exitCode !== null) {
                errorMessage = `Verdaccio 进程异常退出，退出码: ${exitCode}`
              }
              
              if (errorOutput.trim()) {
                const errorLines = errorOutput.split('\n').filter(line => line.trim()).slice(-5)
                errorMessage += `\n错误输出:\n${errorLines.join('\n')}`
              }
              
              if (startupOutput.trim()) {
                const outputLines = startupOutput.split('\n').filter(line => line.trim())
                const lastLines = outputLines.slice(-10)
                errorMessage += `\n最后输出:\n${lastLines.join('\n')}`
              }
              
              addLog(`错误: ${errorMessage}`)
              reject(new Error(errorMessage))
            }
          })
            verifyReq.setTimeout(3000, () => {
              // 超时时，先检查请求是否已完成
              if (!verifyReq.destroyed) {
                verifyReq.destroy()
              }
              if (!resolved && !rejected) {
                rejected = true
                clearTimeout(timeout)
                clearInterval(checkInterval)
                
                let errorMessage = 'Verdaccio 进程退出，且服务验证超时'
                if (exitCode !== 0 && exitCode !== null) {
                  errorMessage = `Verdaccio 进程异常退出，退出码: ${exitCode}`
                }
                
                addLog(`错误: ${errorMessage}`)
                reject(new Error(errorMessage))
              }
            })
          }).catch(() => {
            // 导入失败，继续处理退出事件
            if (!rejected) {
              rejected = true
              clearTimeout(timeout)
              clearInterval(checkInterval)
              
              let errorMessage = 'Verdaccio 进程退出，且无法验证服务'
              if (exitCode !== 0 && exitCode !== null) {
                errorMessage = `Verdaccio 进程异常退出，退出码: ${exitCode}`
              }
              
              addLog(`错误: ${errorMessage}`)
              reject(new Error(errorMessage))
            }
          })
          return
        }
        
        if (!rejected) {
          rejected = true
          clearTimeout(timeout)
          clearInterval(checkInterval)
          
          // 构建详细的错误信息
          let errorMessage = 'Verdaccio 进程意外退出'
          if (exitSignal) {
            errorMessage = `Verdaccio 进程被信号终止: ${exitSignal}`
          } else if (exitCode !== 0 && exitCode !== null) {
            errorMessage = `Verdaccio 进程异常退出，退出码: ${exitCode}`
          }
          
          // 如果有错误输出，添加到错误信息中
          if (errorOutput.trim()) {
            const errorLines = errorOutput.split('\n').filter(line => line.trim()).slice(-5)
            errorMessage += `\n错误输出:\n${errorLines.join('\n')}`
          }
          
          // 如果有启动输出，也包含一些关键信息
          if (startupOutput.trim()) {
            const outputLines = startupOutput.split('\n').filter(line => line.trim())
            const lastLines = outputLines.slice(-10)
            errorMessage += `\n最后输出:\n${lastLines.join('\n')}`
          }
          
          addLog(`错误: ${errorMessage}`)
          reject(new Error(errorMessage))
        }
      })
      
      const timeout = setTimeout(() => {
        if (!resolved && !rejected) {
          rejected = true
          clearInterval(checkInterval)
          
          // 检查进程是否还在运行
          if (!verdaccioProcess.killed && exitCode === null) {
            // 进程还在运行，但超时了，可能是启动标志检测失败
            addLog('警告: 启动超时，但进程仍在运行。尝试验证服务...')
            // 不立即 kill，先尝试验证服务
            import('http').then((http) => {
              const testReq = http.get(`http://localhost:${verdaccioPort}/-/ping`, (res: any) => {
                if (res.statusCode === 200) {
                  // 服务实际上已经启动
                  resolved = true
                  addLog('服务验证成功（虽然超时）')
                  resolve()
                } else {
                  verdaccioProcess.kill('SIGTERM')
                  addLog('错误: Verdaccio 启动超时（30秒），且服务未响应')
                  reject(new Error('Verdaccio 启动超时（30秒），且服务未响应'))
                }
              })
              testReq.on('error', (err: any) => {
                // 忽略 abort 相关的错误
                if (err.code === 'ECONNRESET' || err.message?.includes('aborted')) {
                  return
                }
                verdaccioProcess.kill('SIGTERM')
                addLog('错误: Verdaccio 启动超时（30秒），且服务未响应')
                reject(new Error('Verdaccio 启动超时（30秒），且服务未响应'))
              })
              testReq.setTimeout(3000, () => {
                // 超时时，先检查请求是否已完成
                if (!testReq.destroyed) {
                  testReq.destroy()
                }
                verdaccioProcess.kill('SIGTERM')
                addLog('错误: Verdaccio 启动超时（30秒），且服务未响应')
                reject(new Error('Verdaccio 启动超时（30秒），且服务未响应'))
              })
            }).catch(() => {
              verdaccioProcess.kill('SIGTERM')
              addLog('错误: Verdaccio 启动超时（30秒），且无法验证服务')
              reject(new Error('Verdaccio 启动超时（30秒），且无法验证服务'))
            })
          } else {
            // 进程已经退出
            let errorMessage = 'Verdaccio 启动超时（30秒）'
            if (exitCode !== null) {
              errorMessage += `，退出码: ${exitCode}`
            }
            if (exitSignal) {
              errorMessage += `，信号: ${exitSignal}`
            }
            if (errorOutput.trim()) {
              const errorLines = errorOutput.split('\n').filter(line => line.trim()).slice(-5)
              errorMessage += `\n错误输出:\n${errorLines.join('\n')}`
            }
            addLog(`错误: ${errorMessage}`)
            reject(new Error(errorMessage))
          }
        }
      }, 30000) // 30 秒超时
      
      const checkInterval = setInterval(() => {
        if (resolved || rejected) {
          clearInterval(checkInterval)
          return
        }
        
        // 检查进程是否还在运行
        if (verdaccioProcess.killed || exitCode !== null) {
          // 进程已退出，但 exit 事件处理器会处理
          return
        }
        
        // 检查输出中是否包含启动成功的标志
        const lowerOutput = startupOutput.toLowerCase()
        // Verdaccio 6.x 启动成功的标志：包含 "http address" 或 "verdaccio/6"
        if (lowerOutput.includes('http address') || 
            lowerOutput.includes('listening') || 
            lowerOutput.includes('http://localhost') ||
            lowerOutput.includes('verdaccio is running') ||
            lowerOutput.includes('verdaccio started') ||
            (lowerOutput.includes('verdaccio/') && lowerOutput.includes('http://'))) {
          // 即使有警告，只要服务启动了就算成功
          clearTimeout(timeout)
          clearInterval(checkInterval)
          resolved = true
          addLog('服务启动信号已收到')
          resolve()
        }
        
        // 检查是否有明显的错误信息
        if (errorOutput.toLowerCase().includes('error') || 
            errorOutput.toLowerCase().includes('fatal') ||
            errorOutput.toLowerCase().includes('cannot') ||
            errorOutput.toLowerCase().includes('failed')) {
          // 检查是否是配置文件路径错误
          if (errorOutput.toLowerCase().includes('config file') && errorOutput.toLowerCase().includes('does not exist')) {
            // 配置文件路径错误，可能是环境变量方式不支持，尝试使用 -c 参数
            addLog('检测到配置文件路径错误，尝试使用 -c 参数方式启动...')
            // 这里不立即失败，等待进程退出后再处理
          } else {
            // 其他错误，等待进程响应
            addLog('检测到可能的错误信息，等待进程响应...')
          }
        }
      }, 500)
      
      verdaccioProcess.on('error', (error) => {
        if (!rejected) {
          rejected = true
          clearTimeout(timeout)
          clearInterval(checkInterval)
          addLog(`错误: 启动 Verdaccio 失败: ${error.message}`)
          reject(new Error(`启动 Verdaccio 失败: ${error.message}`))
        }
      })
    })
    
    // 等待一下确保服务完全启动
    addLog('等待服务完全启动...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 验证服务是否正常运行
    addLog('验证服务是否正常运行...')
    try {
      const http = await import('http')
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`http://localhost:${verdaccioPort}/-/ping`, (res) => {
          if (res.statusCode === 200) {
            addLog('服务验证成功')
            resolve()
          } else {
            reject(new Error(`Verdaccio 服务响应异常: HTTP ${res.statusCode}`))
          }
        })
        req.on('error', (err: any) => {
          // 忽略 abort 相关的错误，这些是正常的超时情况
          if (err.code === 'ECONNRESET' || err.message?.includes('aborted')) {
            reject(new Error('连接 Verdaccio 服务超时'))
          } else {
            reject(err)
          }
        })
        req.setTimeout(5000, () => {
          // 超时时，先检查请求是否已完成
          if (!req.destroyed) {
            req.destroy()
          }
          reject(new Error('连接 Verdaccio 服务超时'))
        })
      })
    } catch (error: any) {
      verdaccioProcess.kill()
      addLog(`错误: 验证 Verdaccio 服务失败: ${error.message}`)
      throw new Error(`验证 Verdaccio 服务失败: ${error.message}`)
    }
    
    // 保存进程信息
    const pid = actualPid || verdaccioProcess.pid || null
    this.verdaccioProcess = {
      process: verdaccioProcess, // 保留引用（Windows 上可能为 null）
      pid,
      port: verdaccioPort,
      configPath: this.VERDACCIO_CONFIG_PATH,
      storagePath: this.VERDACCIO_STORAGE_PATH,
      startedAt: new Date(),
      isDetached: true, // 标记为独立进程
    }
    
    // 写入 PID 文件，用于进程恢复
    if (pid) {
      await this.writePidFile(pid, verdaccioPort)
      addLog(`PID 文件已保存: ${this.VERDACCIO_PID_FILE}`)
    } else {
      addLog('警告: 无法获取进程 PID，进程恢复功能可能不可用')
    }
    
    addLog(`Verdaccio 已成功启动在端口 ${verdaccioPort}，PID: ${pid || 'unknown'}`)
    addLog(`Verdaccio 进程已设置为独立运行，server 重启不会影响 Verdaccio 服务`)
    
    // 创建或更新本地 Verdaccio 仓库配置
    addLog('创建仓库配置...')
    const registry = await this.findOrCreateLocalVerdaccioRegistry(verdaccioPort, registryId)
    addLog('仓库配置已创建')
    
    // 显示默认管理员账户信息（Verdaccio 启动后，用户需要通过 npm adduser 手动创建）
    addLog('═══════════════════════════════════════')
    addLog('默认管理员账户信息:')
    addLog('  用户名: admin')
    addLog('  密码: admin123')
    addLog('  邮箱: admin@example.com')
    addLog('═══════════════════════════════════════')
    addLog('提示: 请使用以下命令创建用户:')
    addLog(`  npm adduser --registry=http://localhost:${verdaccioPort}/`)
    addLog('═══════════════════════════════════════')
    
    return {
      registry,
      port: verdaccioPort,
      url: `http://localhost:${verdaccioPort}/`,
      logs,
    }
  } catch (error: any) {
      // 记录错误日志
      const errorMessage = error?.message || '未知错误'
      addLog(`启动失败: ${errorMessage}`)
      this.logger.error(`[Verdaccio] 启动失败: ${errorMessage}`)
      this.logger.error(`[Verdaccio] 错误堆栈: ${error.stack || '无堆栈信息'}`)
      
      // 确保错误信息包含日志
      const enhancedError = new Error(errorMessage)
      enhancedError.stack = error.stack
      ;(enhancedError as any).logs = logs
      
      // 重新抛出错误，让 controller 处理
      throw enhancedError
    }
  }
  
  /**
   * 使用 npm adduser 创建默认管理员账户
   * 这是最可靠的方式，因为 Verdaccio 需要管理自己的用户数据库
   */
  private async createAdminUserWithNpmAdduser(port: number, addLog: (msg: string) => void): Promise<void> {
    const registryUrl = `http://localhost:${port}/`
    
    addLog('使用 npm adduser 创建默认管理员账户...')
    addLog('默认用户名: admin')
    addLog('默认密码: admin123')
    addLog('默认邮箱: admin@example.com')
    
    try {
      // 检查用户是否已存在
      try {
        const { stdout } = await execAsync(`npm whoami --registry=${registryUrl}`, {
          timeout: 3000,
          encoding: 'utf8',
        })
        if (stdout.trim() === 'admin') {
          addLog('admin 用户已存在，跳过创建')
          return
        }
      } catch {
        // 用户不存在，继续创建
      }
      
      // 使用 npm adduser 创建用户（让 Verdaccio 自己管理密码）
      addLog('使用 npm adduser 创建默认管理员账户...')
      addLog('默认用户名: admin')
      addLog('默认密码: admin123')
      
      try {
        await this.loginWithNpmAdduser(registryUrl, 'admin', 'admin123', 'admin@example.com', true)
        addLog('默认管理员账户创建成功（通过 npm adduser）')
        addLog('提示: 您可以使用用户名 "admin" 和密码 "admin123" 登录')
      } catch (adduserError: any) {
        // npm adduser 可能失败，记录错误但不阻止启动
        if (adduserError.message && (
          adduserError.message.includes('Exit handler never called') ||
          adduserError.message.includes('timeout') ||
          adduserError.message.includes('超时')
        )) {
          addLog('警告: npm adduser 命令执行异常')
          addLog('提示: Verdaccio 启动后，您可以使用 npm adduser 手动创建用户')
          addLog('提示: 或通过命令行执行: npm adduser --registry=' + registryUrl)
          // 不抛出错误，允许继续
          return
        }
        // 其他错误也允许继续
        addLog(`警告: npm adduser 失败: ${adduserError.message}`)
        addLog('提示: Verdaccio 启动后，您可以使用 npm adduser 手动创建用户')
        // 不抛出错误，允许继续
        return
      }
    } catch (error: any) {
      // 如果用户已存在，这是正常的
      if (error.message && error.message.includes('user already exists')) {
        addLog('admin 用户已存在，跳过创建')
        return
      }
      // 对于其他错误，记录但不阻止启动
      addLog(`警告: 创建默认管理员账户失败: ${error.message}`)
      addLog('提示: 您可以使用 npm adduser 手动创建用户，或直接使用 htpasswd 文件中的用户')
      // 不抛出错误，允许 Verdaccio 正常启动
    }
  }

  /**
   * 创建默认管理员账户
   * 默认用户名: admin，密码: admin123
   * 注意：不手动创建 htpasswd 文件，让 Verdaccio 自己管理用户和密码
   */
  private async createDefaultAdminUser(configDir: string, addLog: (msg: string) => void): Promise<void> {
    // 不手动创建 htpasswd 文件，让 Verdaccio 自己管理
    // 用户创建应该通过 npm adduser 完成
    addLog('提示: 默认管理员账户将通过 npm adduser 创建')
    addLog('提示: 如果用户已存在，请使用正确的密码登录')
  }
  
  /**
   * 清理所有旧的本地 Verdaccio 仓库记录（除了指定端口和当前仓库）
   */
  private async cleanupOldLocalVerdaccioRegistries(keepPort?: number, currentRegistryId?: string): Promise<void> {
    try {
      const allRegistries = await this.npmRegistryRepository.find()
      const localVerdaccioRegistries = allRegistries.filter((registry) => {
        const registryUrl = registry.registry.toLowerCase().replace(/\/$/, '')
        const registryName = (registry.name || '').toLowerCase()
        const isLocalhost = registryUrl.includes('localhost') || registryUrl.includes('127.0.0.1')
        const isLocalVerdaccioName = registryName.includes('本地 verdaccio') || 
                                     registryName.includes('local verdaccio') ||
                                     (registryName.includes('verdaccio') && isLocalhost)
        return isLocalhost && isLocalVerdaccioName
      })
      
      // 处理所有旧的本地 Verdaccio 仓库记录
      for (const registry of localVerdaccioRegistries) {
        const urlMatch = registry.registry.match(/localhost:(\d+)/) || registry.registry.match(/127\.0\.0\.1:(\d+)/)
        if (urlMatch) {
          const port = parseInt(urlMatch[1], 10)
          
          // 如果是当前正在编辑的仓库，更新其端口而不是删除
          if (currentRegistryId && registry.id === currentRegistryId) {
            if (keepPort !== undefined && port !== keepPort) {
              this.logger.log(`[Verdaccio] 更新当前仓库记录的端口（从 ${port} 到 ${keepPort}）`)
              registry.registry = `http://localhost:${keepPort}/`
              registry.name = `本地 Verdaccio (端口 ${keepPort})`
              await this.npmRegistryRepository.save(registry)
            }
            continue // 跳过删除当前仓库
          }
          
          // 如果指定了保留端口，且当前端口不是保留端口，则删除
          if (keepPort !== undefined && port !== keepPort) {
            this.logger.log(`[Verdaccio] 删除旧的本地 Verdaccio 仓库记录（端口 ${port}）`)
            await this.npmRegistryRepository.remove(registry)
          } else if (keepPort === undefined) {
            // 如果没有指定保留端口，删除所有旧的记录（除了当前仓库）
            this.logger.log(`[Verdaccio] 删除旧的本地 Verdaccio 仓库记录（端口 ${port}）`)
            await this.npmRegistryRepository.remove(registry)
          }
        }
      }
    } catch (error: any) {
      this.logger.warn(`[Verdaccio] 清理旧的本地 Verdaccio 仓库记录失败: ${error.message}`)
    }
  }

  private async findOrCreateLocalVerdaccioRegistry(port: number, currentRegistryId?: string): Promise<NpmRegistry> {
    const registryUrl = `http://localhost:${port}/`
    
    // 先清理所有旧的本地 Verdaccio 仓库记录（保留当前端口和当前仓库）
    await this.cleanupOldLocalVerdaccioRegistries(port, currentRegistryId)
    
    // 查找是否已存在
    const existing = await this.npmRegistryRepository.findOne({
      where: { registry: registryUrl },
    })
    
    if (existing) {
      return existing
    }
    
    // 如果当前仓库存在但端口不同，更新它
    if (currentRegistryId) {
      const currentRegistry = await this.npmRegistryRepository.findOne({
        where: { id: currentRegistryId },
      })
      if (currentRegistry) {
        this.logger.log(`[Verdaccio] 更新当前仓库记录的端口（从 ${currentRegistry.registry} 到 ${registryUrl}）`)
        currentRegistry.registry = registryUrl
        currentRegistry.name = `本地 Verdaccio (端口 ${port})`
        return await this.npmRegistryRepository.save(currentRegistry)
      }
    }
    
    // 创建新的配置
    const registry = this.npmRegistryRepository.create({
      name: `本地 Verdaccio (端口 ${port})`,
      registry: registryUrl,
      isDefault: false,
      enabled: true,
      order: 0,
      isLoggedIn: false,
      username: null,
      email: null,
    })
    
    return await this.npmRegistryRepository.save(registry)
  }
  
  /**
   * 通过端口停止 Verdaccio 进程
   */
  private async killVerdaccioByPort(port: number): Promise<void> {
    try {
      if (process.platform === 'win32') {
        // Windows 平台
        try {
          const { stdout } = await execAsync(`netstat -ano | findstr :${port}`)
          const lines = stdout.split('\n').filter(line => line.includes('LISTENING'))
          
          const pids = new Set<string>()
          for (const line of lines) {
            const match = line.match(/\s+(\d+)\s*$/)
            if (match) {
              pids.add(match[1])
            }
          }
          
          if (pids.size > 0) {
            this.logger.log(`[Verdaccio] 找到 ${pids.size} 个占用端口 ${port} 的进程，正在停止...`)
            // 停止所有占用该端口的进程
            for (const pid of pids) {
              try {
                await execAsync(`taskkill /F /PID ${pid}`)
                this.logger.log(`[Verdaccio] 已停止进程 PID: ${pid}`)
              } catch (error: any) {
                this.logger.warn(`[Verdaccio] 停止进程 PID ${pid} 失败: ${error.message}`)
              }
            }
            // 等待进程完全终止（Windows 需要更长时间）
            await new Promise(resolve => setTimeout(resolve, 2000))
            
            // 验证端口是否已释放
            let retries = 5
            while (retries > 0) {
              try {
                const { stdout: checkStdout } = await execAsync(`netstat -ano | findstr :${port}`)
                const checkLines = checkStdout.split('\n').filter(line => line.includes('LISTENING'))
                if (checkLines.length === 0) {
                  this.logger.log(`[Verdaccio] 端口 ${port} 已释放`)
                  return
                }
              } catch {
                // 如果 netstat 失败，说明端口可能已释放
                this.logger.log(`[Verdaccio] 端口 ${port} 可能已释放`)
                return
              }
              retries--
              await new Promise(resolve => setTimeout(resolve, 500))
            }
            
            this.logger.warn(`[Verdaccio] 端口 ${port} 可能仍被占用`)
          } else {
            this.logger.log(`[Verdaccio] 未找到占用端口 ${port} 的进程`)
          }
        } catch (error: any) {
          // 如果没有找到进程或命令执行失败，可能是进程已经退出
          this.logger.warn(`[Verdaccio] 未找到占用端口 ${port} 的进程，可能已经退出`)
        }
      } else {
        // Unix/Linux/Mac 平台
        try {
          const { stdout } = await execAsync(`lsof -ti:${port}`)
          const pids = stdout.trim().split('\n').filter(pid => pid.trim())
          
          if (pids.length > 0) {
            this.logger.log(`[Verdaccio] 找到 ${pids.length} 个占用端口 ${port} 的进程，正在停止...`)
            // 停止所有占用该端口的进程
            for (const pid of pids) {
              try {
                await execAsync(`kill -9 ${pid.trim()}`)
                this.logger.log(`[Verdaccio] 已停止进程 PID: ${pid.trim()}`)
              } catch (error: any) {
                this.logger.warn(`[Verdaccio] 停止进程 PID ${pid.trim()} 失败: ${error.message}`)
              }
            }
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // 验证端口是否已释放
            let retries = 5
            while (retries > 0) {
              try {
                const { stdout: checkStdout } = await execAsync(`lsof -ti:${port}`)
                if (!checkStdout.trim()) {
                  this.logger.log(`[Verdaccio] 端口 ${port} 已释放`)
                  return
                }
              } catch {
                // 如果 lsof 失败，说明端口可能已释放
                this.logger.log(`[Verdaccio] 端口 ${port} 可能已释放`)
                return
              }
              retries--
              await new Promise(resolve => setTimeout(resolve, 500))
            }
            
            this.logger.warn(`[Verdaccio] 端口 ${port} 可能仍被占用`)
          } else {
            this.logger.log(`[Verdaccio] 未找到占用端口 ${port} 的进程`)
          }
        } catch (error: any) {
          // 如果没有找到进程或命令执行失败，可能是进程已经退出
          this.logger.warn(`[Verdaccio] 未找到占用端口 ${port} 的进程，可能已经退出`)
        }
      }
    } catch (error: any) {
      // 如果命令执行失败，可能是进程已经退出或端口未被占用
      this.logger.warn(`[Verdaccio] 通过端口停止进程失败: ${error.message}`)
      // 不抛出错误，因为进程可能已经退出
    }
  }

  /**
   * 停止本地 Verdaccio 服务
   * 不仅检查内存中的进程状态，还会检查实际运行的 Verdaccio 服务并停止它
   */
  async stopLocalVerdaccio(): Promise<void> {
    // 首先检查内存中的进程状态
    if (this.verdaccioProcess) {
      const processInfo = this.verdaccioProcess
      const pid = processInfo.pid
      const port = processInfo.port
      const isDetached = processInfo.isDetached
      
      // 如果是独立进程，通过 PID 停止
      if (isDetached && pid) {
        this.logger.log(`[Verdaccio] 正在停止 Verdaccio 服务（独立进程，PID: ${pid}）...`)
        try {
          await this.killProcessByPid(pid)
          this.logger.log(`[Verdaccio] Verdaccio 服务已停止（PID: ${pid}）`)
        } catch (error: any) {
          this.logger.error(`[Verdaccio] 停止服务失败: ${error.message}`)
          // 如果通过 PID 停止失败，尝试通过端口停止
          try {
            await this.killVerdaccioByPort(port)
            this.logger.log(`[Verdaccio] 通过端口停止成功`)
          } catch (portError: any) {
            throw new Error(`停止 Verdaccio 服务失败: ${error.message}`)
          }
        } finally {
          // 清理进程引用和 PID 文件
          this.verdaccioProcess = null
          await this.deletePidFile()
        }
        return
      }
      
      // 如果不是独立进程，使用原来的方式停止
      if (processInfo.process && !processInfo.process.killed) {
        this.logger.log(`[Verdaccio] 正在停止 Verdaccio 服务（内存中的进程）...`)
        
        const process = processInfo.process
        
        try {
          // 检查进程是否已经退出
          if (process.killed) {
            this.logger.log(`[Verdaccio] 进程已经退出`)
            this.verdaccioProcess = null
            await this.deletePidFile()
            return
          }
          
          // 发送 SIGTERM 信号
          process.kill('SIGTERM')
          
          // 等待进程退出（最多 5 秒）
          await new Promise<void>((resolve) => {
            let resolved = false
            
            // 检查进程是否已经退出（可能在发送信号前就已经退出）
            if (process.killed) {
              resolved = true
              resolve()
              return
            }
            
            const timeout = setTimeout(() => {
              if (resolved) {
                return
              }
              
              // 超时后强制终止
              try {
                if (!process.killed) {
                  this.logger.warn(`[Verdaccio] 进程未在 5 秒内退出，强制终止...`)
                  process.kill('SIGKILL')
                  
                  // 再等待 1 秒
                  setTimeout(() => {
                    if (!resolved) {
                      resolved = true
                      this.logger.warn(`[Verdaccio] 强制终止完成（进程可能已退出）`)
                      resolve()
                    }
                  }, 1000)
                } else {
                  resolved = true
                  resolve()
                }
              } catch (killError: any) {
                // 如果 kill 失败，可能是进程已经退出
                this.logger.warn(`[Verdaccio] 强制终止失败: ${killError.message}，可能进程已退出`)
                resolved = true
                resolve()
              }
            }, 5000)
            
            // 监听退出事件
            const exitHandler = () => {
              if (resolved) {
                return
              }
              resolved = true
              clearTimeout(timeout)
              resolve()
            }
            
            process.on('exit', exitHandler)
            
            // 如果进程已经退出，立即解析
            if (process.killed) {
              exitHandler()
            }
          })
          
          this.logger.log(`[Verdaccio] Verdaccio 服务已停止`)
        } catch (error: any) {
          this.logger.error(`[Verdaccio] 停止服务失败: ${error.message}`)
          throw new Error(`停止 Verdaccio 服务失败: ${error.message}`)
        } finally {
          // 确保清理进程引用和 PID 文件
          this.verdaccioProcess = null
          await this.deletePidFile()
        }
        
        return
      }
    }
    
    // 如果内存中没有进程，检查 PID 文件
    try {
      const pidContent = await fs.readFile(this.VERDACCIO_PID_FILE, 'utf-8')
      const pidData = JSON.parse(pidContent.trim())
      const pid = pidData.pid
      const port = pidData.port
      
      if (pid && port) {
        this.logger.log(`[Verdaccio] 从 PID 文件找到进程，正在停止（PID: ${pid}, Port: ${port}）...`)
        try {
          await this.killProcessByPid(pid)
          this.logger.log(`[Verdaccio] Verdaccio 服务已停止（PID: ${pid}）`)
        } catch (error: any) {
          // 如果通过 PID 停止失败，尝试通过端口停止
          this.logger.warn(`[Verdaccio] 通过 PID 停止失败，尝试通过端口停止: ${error.message}`)
          await this.killVerdaccioByPort(port)
          this.logger.log(`[Verdaccio] 通过端口停止成功`)
        } finally {
          await this.deletePidFile()
        }
        return
      }
    } catch {
      // PID 文件不存在或格式错误，继续检查实际运行的服务
    }
    
    // 如果内存中没有进程，检查实际运行的 Verdaccio 服务
    const verdaccioStatus = await this.getLocalVerdaccioStatus()
    
    if (!verdaccioStatus.running || !verdaccioStatus.port) {
      // 清理可能存在的 PID 文件
      await this.deletePidFile()
      throw new Error('Verdaccio 服务未运行')
    }
    
    // 通过端口停止 Verdaccio 进程
    this.logger.log(`[Verdaccio] 正在停止 Verdaccio 服务（端口 ${verdaccioStatus.port}）...`)
    await this.killVerdaccioByPort(verdaccioStatus.port)
    this.logger.log(`[Verdaccio] Verdaccio 服务已停止`)
    
    // 清理 PID 文件
    await this.deletePidFile()
  }

  /**
   * 通过 PID 停止进程
   */
  private async killProcessByPid(pid: number): Promise<void> {
    try {
      if (process.platform === 'win32') {
        // Windows: 使用 taskkill
        await execAsync(`taskkill /F /PID ${pid}`)
        this.logger.log(`[Verdaccio] 已停止进程 PID: ${pid}`)
        // 等待进程完全终止
        await new Promise(resolve => setTimeout(resolve, 1000))
      } else {
        // Unix/Linux/Mac: 使用 kill
        try {
          await execAsync(`kill -TERM ${pid}`)
          // 等待进程退出（最多 3 秒）
          await new Promise(resolve => setTimeout(resolve, 3000))
          
          // 检查进程是否还在运行
          const isRunning = await this.isProcessRunning(pid)
          if (isRunning) {
            // 如果还在运行，强制终止
            this.logger.warn(`[Verdaccio] 进程未在 3 秒内退出，强制终止...`)
            await execAsync(`kill -KILL ${pid}`)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          this.logger.log(`[Verdaccio] 已停止进程 PID: ${pid}`)
        } catch (error: any) {
          // 如果 kill 失败，可能是进程已经退出
          const isRunning = await this.isProcessRunning(pid)
          if (isRunning) {
            throw error
          }
          this.logger.log(`[Verdaccio] 进程 PID ${pid} 已退出`)
        }
      }
    } catch (error: any) {
      // 检查进程是否还在运行
      const isRunning = await this.isProcessRunning(pid)
      if (isRunning) {
        throw new Error(`停止进程 PID ${pid} 失败: ${error.message}`)
      }
      // 进程已经退出，忽略错误
      this.logger.log(`[Verdaccio] 进程 PID ${pid} 已退出`)
    }
  }
  
  /**
   * 停止所有 Verdaccio 进程（不管端口）
   */
  private async stopAllVerdaccioProcesses(): Promise<void> {
    const stoppedPorts = new Set<number>()
    
    // 1. 停止内存中的进程
    if (this.verdaccioProcess && this.verdaccioProcess.process && !this.verdaccioProcess.process.killed && !this.verdaccioProcess.isDetached) {
      const memoryPort = this.verdaccioProcess.port
      this.logger.log(`[Verdaccio] 正在停止内存中的 Verdaccio 进程（端口 ${memoryPort}）...`)
      try {
        const process = this.verdaccioProcess.process
        process.kill('SIGTERM')
        
        // 等待进程退出（最多 3 秒）
        await new Promise<void>((resolve) => {
          let resolved = false
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true
              if (!process.killed) {
                this.logger.warn(`[Verdaccio] 进程未在 3 秒内退出，强制终止...`)
                process.kill('SIGKILL')
              }
              resolve()
            }
          }, 3000)
          
          process.on('exit', () => {
            if (!resolved) {
              resolved = true
              clearTimeout(timeout)
              resolve()
            }
          })
          
          if (process.killed) {
            if (!resolved) {
              resolved = true
              clearTimeout(timeout)
              resolve()
            }
          }
        })
        
        this.verdaccioProcess = null
        stoppedPorts.add(memoryPort)
        this.logger.log(`[Verdaccio] 内存中的进程已停止`)
      } catch (error: any) {
        this.logger.warn(`[Verdaccio] 停止内存中的进程失败: ${error.message}`)
        this.verdaccioProcess = null
      }
    }
    
    // 2. 从数据库中获取所有本地 Verdaccio 仓库的端口
    try {
      const allRegistries = await this.npmRegistryRepository.find()
      const localVerdaccioRegistries = allRegistries.filter((registry) => {
        const registryUrl = registry.registry.toLowerCase().replace(/\/$/, '')
        const registryName = (registry.name || '').toLowerCase()
        const isLocalhost = registryUrl.includes('localhost') || registryUrl.includes('127.0.0.1')
        const isLocalVerdaccioName = registryName.includes('本地 verdaccio') || 
                                     registryName.includes('local verdaccio') ||
                                     (registryName.includes('verdaccio') && isLocalhost)
        return isLocalhost && isLocalVerdaccioName
      })
      
      // 提取所有端口
      const portsToCheck = new Set<number>()
      for (const registry of localVerdaccioRegistries) {
        const urlMatch = registry.registry.match(/localhost:(\d+)/) || registry.registry.match(/127\.0\.0\.1:(\d+)/)
        if (urlMatch) {
          const port = parseInt(urlMatch[1], 10)
          portsToCheck.add(port)
        }
      }
      
      // 检查并停止这些端口上的进程
      for (const checkPort of portsToCheck) {
        if (stoppedPorts.has(checkPort)) {
          continue // 已经停止过了
        }
        try {
          const isRunning = await this.checkVerdaccioPortRunning(checkPort)
          if (isRunning) {
            this.logger.log(`[Verdaccio] 检测到端口 ${checkPort} 有 Verdaccio 服务运行，正在停止...`)
            await this.killVerdaccioByPort(checkPort)
            stoppedPorts.add(checkPort)
            // 等待端口释放
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        } catch (error: any) {
          // 忽略错误，继续检查下一个端口
          this.logger.debug(`[Verdaccio] 检查端口 ${checkPort} 失败: ${error.message}`)
        }
      }
    } catch (error: any) {
      this.logger.warn(`[Verdaccio] 从数据库获取端口列表失败: ${error.message}`)
    }
    
    // 3. 检查并停止常见端口的进程（作为兜底）
    const commonPorts = [4873, 4872, 4874, 4875, 4876]
    for (const checkPort of commonPorts) {
      if (stoppedPorts.has(checkPort)) {
        continue // 已经停止过了
      }
      try {
        const isRunning = await this.checkVerdaccioPortRunning(checkPort)
        if (isRunning) {
          this.logger.log(`[Verdaccio] 检测到端口 ${checkPort} 有 Verdaccio 服务运行，正在停止...`)
          await this.killVerdaccioByPort(checkPort)
          stoppedPorts.add(checkPort)
          // 等待端口释放
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error: any) {
        // 忽略错误，继续检查下一个端口
        this.logger.debug(`[Verdaccio] 检查端口 ${checkPort} 失败: ${error.message}`)
      }
    }
    
    // 4. 等待所有进程完全停止
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (stoppedPorts.size > 0) {
      this.logger.log(`[Verdaccio] 已停止 ${stoppedPorts.size} 个 Verdaccio 进程（端口: ${Array.from(stoppedPorts).join(', ')}）`)
    }
  }

  /**
   * 重启本地 Verdaccio 服务
   * 先停止所有 Verdaccio 进程，然后重新启动
   */
  async restartLocalVerdaccio(port?: number, registryId?: string): Promise<{ registry: NpmRegistry; port: number; url: string; logs?: string[] }> {
    this.logger.log('[Verdaccio] 开始重启 Verdaccio 服务...')
    
    // 从配置文件中读取端口（如果配置文件存在）
    let verdaccioPort = port || this.DEFAULT_VERDACCIO_PORT
    try {
      await fs.access(this.VERDACCIO_CONFIG_PATH)
      const configContent = await fs.readFile(this.VERDACCIO_CONFIG_PATH, 'utf-8')
      const configPort = this.parsePortFromConfig(configContent)
      if (configPort !== null) {
        verdaccioPort = configPort
        this.logger.log(`[Verdaccio] 从配置文件中读取端口: ${verdaccioPort}`)
      } else if (port) {
        verdaccioPort = port
        this.logger.log(`[Verdaccio] 使用传入的端口参数: ${verdaccioPort}`)
      }
    } catch {
      if (port) {
        verdaccioPort = port
      }
      this.logger.log(`[Verdaccio] 配置文件不存在，使用端口: ${verdaccioPort}`)
    }
    
    // 发送重启开始事件
    if (this.wsEventsService) {
      this.wsEventsService.sendVerdaccioRestartStart({
        registryId,
        port: verdaccioPort,
        status: 'stopping',
        message: '开始重启 Verdaccio 服务',
        progress: 0,
      })
    }
    
    try {
      // 停止所有 Verdaccio 进程
      this.logger.log(`[Verdaccio] 正在停止所有 Verdaccio 进程...`)
      
      // 发送停止中事件
      if (this.wsEventsService) {
        this.wsEventsService.sendVerdaccioRestartStopping({
          registryId,
          port: verdaccioPort,
          status: 'stopping',
          message: '正在停止 Verdaccio 服务...',
          progress: 25,
        })
      }
      
      await this.stopAllVerdaccioProcesses()
      
      // 等待服务完全停止并确保端口释放（最多等待 10 秒）
      let stopped = false
      let portReleased = false
      
      // 检查服务是否停止
      for (let i = 0; i < 50; i++) {
        try {
          const checkStatus = await this.getLocalVerdaccioStatus()
          if (!checkStatus.running) {
            stopped = true
            break
          }
        } catch (checkError: any) {
          // 如果检查状态时出错，假设服务已停止
          this.logger.warn(`[Verdaccio] 检查服务状态时出错: ${checkError.message}，假设服务已停止`)
          stopped = true
          break
        }
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // 检查端口是否释放
      for (let i = 0; i < 50; i++) {
        try {
          const isPortInUse = await this.checkVerdaccioPortRunning(verdaccioPort)
          if (!isPortInUse) {
            portReleased = true
            break
          }
          this.logger.log(`[Verdaccio] 端口 ${verdaccioPort} 仍被占用，等待释放... (${i + 1}/50)`)
        } catch (checkError: any) {
          // 如果检查端口时出错，假设端口已释放
          this.logger.warn(`[Verdaccio] 检查端口 ${verdaccioPort} 时出错: ${checkError.message}，假设端口已释放`)
          portReleased = true
          break
        }
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      if (!stopped) {
        this.logger.warn('[Verdaccio] 服务停止超时，但继续尝试启动...')
      }
      
      if (!portReleased) {
        this.logger.warn(`[Verdaccio] 端口 ${verdaccioPort} 释放超时，尝试强制释放...`)
        // 再次尝试通过端口停止进程
        await this.killVerdaccioByPort(verdaccioPort)
        // 再等待 2 秒
        await new Promise(resolve => setTimeout(resolve, 2000))
        // 再次检查端口
        try {
          const stillInUse = await this.checkVerdaccioPortRunning(verdaccioPort)
          if (stillInUse) {
            this.logger.error(`[Verdaccio] 端口 ${verdaccioPort} 仍被占用，无法启动新服务`)
            throw new Error(`端口 ${verdaccioPort} 仍被占用，请手动停止占用该端口的进程`)
          }
        } catch (checkError: any) {
          // 如果检查端口时出错，假设端口已释放
          this.logger.warn(`[Verdaccio] 检查端口 ${verdaccioPort} 时出错: ${checkError.message}，假设端口已释放`)
        }
        portReleased = true
      }
      
      if (stopped && portReleased) {
        this.logger.log('[Verdaccio] 所有 Verdaccio 服务已停止，端口已释放')
      }
      
      // 发送已停止事件
      if (this.wsEventsService) {
        this.wsEventsService.sendVerdaccioRestartStopping({
          registryId,
          port: verdaccioPort,
          status: 'stopped',
          message: 'Verdaccio 服务已停止',
          progress: 50,
        })
      }
      
      // 等待一小段时间确保端口释放
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 清理旧的本地 Verdaccio 仓库记录（保留当前端口和当前仓库）
      this.logger.log(`[Verdaccio] 清理旧的本地 Verdaccio 仓库记录...`)
      await this.cleanupOldLocalVerdaccioRegistries(verdaccioPort, registryId)
      
      // 重新启动服务
      this.logger.log(`[Verdaccio] 正在启动 Verdaccio 服务（端口 ${verdaccioPort}）...`)
      
      // 发送启动中事件
      if (this.wsEventsService) {
        this.wsEventsService.sendVerdaccioRestartStarting({
          registryId,
          port: verdaccioPort,
          status: 'starting',
          message: '正在启动 Verdaccio 服务...',
          progress: 75,
        })
      }
      
      const result = await this.startLocalVerdaccio(verdaccioPort, registryId)
      
      this.logger.log('[Verdaccio] Verdaccio 服务重启成功')
      
      // 发送重启完成事件
      if (this.wsEventsService) {
        this.wsEventsService.sendVerdaccioRestartComplete({
          registryId,
          port: verdaccioPort,
          status: 'completed',
          message: 'Verdaccio 服务重启成功',
          progress: 100,
          url: result.url,
          logs: result.logs,
        })
      }
      
      return result
    } catch (error: any) {
      this.logger.error(`[Verdaccio] 重启服务失败: ${error.message}`)
      
      // 发送重启失败事件
      if (this.wsEventsService) {
        this.wsEventsService.sendVerdaccioRestartError({
          registryId,
          port: verdaccioPort,
          status: 'failed',
          message: `重启失败: ${error.message}`,
          error: error.message,
        })
      }
      
      throw new Error(`重启 Verdaccio 服务失败: ${error.message}`)
    }
  }

  /**
   * 获取本地 Verdaccio 服务状态
   * 不仅检查内存中的进程状态，还会检查实际运行的 Verdaccio 服务
   */
  async getLocalVerdaccioStatus(): Promise<{ running: boolean; port?: number; url?: string }> {
    this.logger.debug('[Verdaccio] 开始检查 Verdaccio 服务状态...')
    
    // 首先检查内存中的进程状态
    if (this.verdaccioProcess) {
      // 如果是独立进程，检查进程是否还在运行
      if (this.verdaccioProcess.isDetached && this.verdaccioProcess.pid) {
        const isRunning = await this.isProcessRunning(this.verdaccioProcess.pid)
        if (isRunning) {
          const isPortListening = await this.checkVerdaccioPortRunning(this.verdaccioProcess.port)
          if (isPortListening) {
            this.logger.debug(`[Verdaccio] 在内存中找到运行中的独立进程，端口: ${this.verdaccioProcess.port}`)
            return {
              running: true,
              port: this.verdaccioProcess.port,
              url: `http://localhost:${this.verdaccioProcess.port}/`,
            }
          } else {
            // 进程存在但端口未监听，清理进程引用
            this.verdaccioProcess = null
            await this.deletePidFile()
          }
        } else {
          // 进程不存在，清理进程引用
          this.verdaccioProcess = null
          await this.deletePidFile()
        }
      } else if (this.verdaccioProcess.process && !this.verdaccioProcess.process.killed) {
        // 非独立进程
        this.logger.debug(`[Verdaccio] 在内存中找到运行中的进程，端口: ${this.verdaccioProcess.port}`)
        return {
          running: true,
          port: this.verdaccioProcess.port,
          url: `http://localhost:${this.verdaccioProcess.port}/`,
        }
      }
    }
    
    // 如果内存中没有进程，检查数据库中是否有本地 Verdaccio 仓库，并验证端口是否在运行
    const allRegistries = await this.npmRegistryRepository.find()
    this.logger.debug(`[Verdaccio] 数据库中找到 ${allRegistries.length} 个仓库`)
    
    const localVerdaccioRegistries = allRegistries.filter((registry) => {
      const registryUrl = registry.registry.toLowerCase().replace(/\/$/, '')
      const registryName = (registry.name || '').toLowerCase()
      const isLocalhost = registryUrl.includes('localhost') || registryUrl.includes('127.0.0.1')
      const isLocalVerdaccioName = registryName.includes('本地 verdaccio') || 
                                   registryName.includes('local verdaccio') ||
                                   (registryName.includes('verdaccio') && isLocalhost)
      return isLocalhost && isLocalVerdaccioName
    })
    
    this.logger.debug(`[Verdaccio] 找到 ${localVerdaccioRegistries.length} 个本地 Verdaccio 仓库`)
    
    // 检查这些仓库的端口是否在运行
    for (const registry of localVerdaccioRegistries) {
      try {
        // 从 URL 中提取端口
        const urlMatch = registry.registry.match(/localhost:(\d+)/) || registry.registry.match(/127\.0\.0\.1:(\d+)/)
        if (urlMatch) {
          const port = parseInt(urlMatch[1], 10)
          this.logger.debug(`[Verdaccio] 检查端口 ${port} 是否在运行...`)
          const isRunning = await this.checkVerdaccioPortRunning(port)
          if (isRunning) {
            this.logger.debug(`[Verdaccio] 端口 ${port} 正在运行`)
            return {
              running: true,
              port,
              url: `http://localhost:${port}/`,
            }
          } else {
            this.logger.debug(`[Verdaccio] 端口 ${port} 未运行`)
          }
        }
      } catch (error: any) {
        this.logger.debug(`[Verdaccio] 检查端口时出错: ${error.message}`)
        // 忽略错误，继续检查下一个
      }
    }
    
    // 如果数据库中没有找到，检查默认端口 4873
    try {
      this.logger.debug(`[Verdaccio] 检查默认端口 ${this.DEFAULT_VERDACCIO_PORT} 是否在运行...`)
      const isDefaultPortRunning = await this.checkVerdaccioPortRunning(this.DEFAULT_VERDACCIO_PORT)
      if (isDefaultPortRunning) {
        this.logger.debug(`[Verdaccio] 默认端口 ${this.DEFAULT_VERDACCIO_PORT} 正在运行`)
        return {
          running: true,
          port: this.DEFAULT_VERDACCIO_PORT,
          url: `http://localhost:${this.DEFAULT_VERDACCIO_PORT}/`,
        }
      } else {
        this.logger.debug(`[Verdaccio] 默认端口 ${this.DEFAULT_VERDACCIO_PORT} 未运行`)
      }
    } catch (error: any) {
      this.logger.debug(`[Verdaccio] 检查默认端口时出错: ${error.message}`)
    }
    
    // 所有检查都失败，返回未运行状态
    this.logger.debug('[Verdaccio] Verdaccio 服务未运行')
    return {
      running: false,
    }
  }

  /**
   * 获取包详情信息
   */
  async getPackageDetail(registryId: string, packageName: string): Promise<any> {
    const registry = await this.findOne(registryId)

    try {
      // 使用 Node.js 内置的 http/https 模块获取包详情
      const { URL } = await import('url')
      const https = await import('https')
      const http = await import('http')
      
      const registryUrl = registry.registry.replace(/\/$/, '')
      const packageUrl = `${registryUrl}/${encodeURIComponent(packageName)}`
      const url = new URL(packageUrl)
      
      const client = url.protocol === 'https:' ? https : http
      
      return new Promise((resolve, reject) => {
        const requestOptions = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          method: 'GET',
          timeout: 10000, // 10秒超时
          headers: {
            'User-Agent': 'LDesign-NPM-Manager/1.0',
            'Accept': 'application/json',
          },
        }
        
        const req = client.request(requestOptions, (res) => {
          let data = ''
          
          res.on('data', (chunk) => {
            data += chunk
          })
          
          res.on('end', () => {
            try {
              const packageInfo = JSON.parse(data)
              
              // 提取关键信息
              const latestVersion = packageInfo['dist-tags']?.latest || Object.keys(packageInfo.versions || {})[0]
              const latestVersionData = packageInfo.versions?.[latestVersion] || {}
              
              const result = {
                name: packageInfo.name,
                description: packageInfo.description || latestVersionData.description,
                latestVersion,
                versions: Object.keys(packageInfo.versions || {}).reverse(), // 从新到旧
                author: latestVersionData.author || packageInfo.author,
                license: latestVersionData.license || packageInfo.license,
                homepage: latestVersionData.homepage || packageInfo.homepage,
                repository: latestVersionData.repository || packageInfo.repository,
                keywords: latestVersionData.keywords || packageInfo.keywords || [],
                dependencies: latestVersionData.dependencies || {},
                devDependencies: latestVersionData.devDependencies || {},
                peerDependencies: latestVersionData.peerDependencies || {},
                readme: packageInfo.readme || latestVersionData.readme || '',
                time: packageInfo.time || {},
                maintainers: packageInfo.maintainers || [],
                distTags: packageInfo['dist-tags'] || {},
              }
              
              this.logger.log(`[NPM Package] 获取包详情成功: ${packageName}`)
              resolve(result)
            } catch (parseError: any) {
              this.logger.error(`解析包详情响应失败: ${parseError.message}`)
              reject(new Error(`解析包详情失败: ${parseError.message}`))
            }
          })
        })
        
        req.on('error', (error: Error) => {
          this.logger.error(`获取包详情请求失败: ${error.message}`)
          reject(new Error(`获取包详情失败: ${error.message}`))
        })
        
        req.on('timeout', () => {
          req.destroy()
          this.logger.error('获取包详情请求超时')
          reject(new Error('获取包详情超时，请稍后重试'))
        })
        
        req.end()
      })
    } catch (error: any) {
      this.logger.error(`获取包详情失败: ${error.message}`)
      throw new Error(`获取包详情失败: ${error.message}`)
    }
  }

  /**
   * 初始化默认 NPM 仓库配置
   */
  async initializeDefaultRegistries(): Promise<void> {
    const count = await this.npmRegistryRepository.count()
    
    if (count === 0) {
      // 创建默认的 npm 官方源
      const defaultRegistry = this.npmRegistryRepository.create({
        name: 'npm官方源',
        registry: 'https://registry.npmjs.org/',
        isDefault: true,
        enabled: true,
        order: 0,
      })
      
      await this.npmRegistryRepository.save(defaultRegistry)
      this.logger.log('已初始化默认 NPM 仓库配置')
    }
  }
}

