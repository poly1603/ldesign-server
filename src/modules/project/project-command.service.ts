import { Injectable, Logger, NotFoundException, Inject, forwardRef, OnApplicationShutdown, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'crypto'
import { Project } from './entities/project.entity.js'
import { CommandExecution, type CommandStatus } from './entities/command-execution.entity.js'
import { EventsGateway } from '../../common/websocket/events.gateway.js'

/**
 * API Operation
 */
@Injectable()
export class ProjectCommandService implements OnApplicationShutdown, OnModuleInit {
  private readonly logger = new Logger(ProjectCommandService.name)
  private readonly runningProcesses = new Map<string, ChildProcess>()

  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(CommandExecution)
    private commandExecutionRepository: Repository<CommandExecution>,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * 模块初始化时清理所有运行中的记录（服务器重启后）
   */
  async onModuleInit() {
    this.logger.log('Module initialized, clearing all running execution records...')
    try {
      const result = await this.commandExecutionRepository.delete({ status: 'running' })
      this.logger.log(`Cleared ${result.affected || 0} running execution records on startup`)
    } catch (error) {
      this.logger.error('Failed to clear execution records on startup:', error)
    }
  }

  /**
   * 应用关闭时的清理工作
   */
  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Application shutting down (signal: ${signal || 'unknown'}), clearing all running executions...`)
    
    // 停止所有正在运行的进程
    for (const [executionId, process] of this.runningProcesses.entries()) {
      try {
        process.kill('SIGTERM')
        this.logger.log(`Stopped process for execution ${executionId}`)
      } catch (error) {
        this.logger.error(`Failed to stop process for execution ${executionId}:`, error)
      }
    }
    
    // 清除所有执行记录
    try {
      const result = await this.commandExecutionRepository.delete({ status: 'running' })
      this.logger.log(`Cleared ${result.affected || 0} running execution records`)
    } catch (error) {
      this.logger.error('Failed to clear execution records:', error)
    }
    
    this.runningProcesses.clear()
  }

  /**
 * API Operation
 */
  async executeCommand(
    projectId: string,
    command: string,
    environment?: string,
  ): Promise<CommandExecution> {
    this.logger.log(`[ExecuteCommand] 开始执行命令: projectId=${projectId}, command=${command}, environment=${environment || 'none'}`)
    
    // Operation
    const project = await this.projectRepository.findOne({ where: { id: projectId }, cache: false })
    if (!project) {
      this.logger.error(`[ExecuteCommand] 项目不存在: ${projectId}`)
      throw new NotFoundException(` ${projectId} `)
    }
    this.logger.log(`[ExecuteCommand] 找到项目: ${project.name}, 路径: ${project.path}`)

    // Operation
    const existing = await this.commandExecutionRepository.findOne({
      where: {
        projectId,
        command,
        environment: environment || null, // 区分不同环境
        status: 'running',
      },
      order: { createdAt: 'DESC' },
      cache: false,
    })

    if (existing) {
      const envText = environment ? ` (${environment})` : ''
      this.logger.warn(`[ExecuteCommand] 命令正在运行中: ${command}${envText}, executionId: ${existing.id}`)
      throw new Error(`命令 ${command}${envText} 正在运行中`)
    }

    // Operation
    const commandLine = this.buildCommandLine(project, command, environment)
    this.logger.log(`[ExecuteCommand] 构建的命令行: ${commandLine}`)
    
    const execution = this.commandExecutionRepository.create({
      id: randomUUID(),
      projectId,
      command,
      environment: environment || null, // 保存环境信息
      commandLine,
      status: 'running',
      output: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    this.logger.log(`[ExecuteCommand] 创建执行记录: executionId=${execution.id}`)
    await this.commandExecutionRepository.save(execution)
    this.logger.log(`[ExecuteCommand] 执行记录已保存: executionId=${execution.id}`)

    // Operation
    this.logger.log(`[ExecuteCommand] 开始运行命令: executionId=${execution.id}`)
    this.runCommand(execution, project).catch((error) => {
      this.logger.error(`[ExecuteCommand] runCommand 失败: executionId=${execution.id}, error=${error.message}`)
    })

    this.logger.log(`[ExecuteCommand] 命令执行已启动: executionId=${execution.id}`)
    return execution
  }

  /**
 * API Operation
 */
  private buildCommandLine(project: Project, command: string, environment?: string): string {
    const pm = project.packageManager || 'pnpm'
    
    const commandMap: Record<string, string> = {
      dev: `${pm} run dev`,
      build: `${pm} run build`,
      preview: `${pm} run preview`,
      test: `${pm} run test`,
      lint: `${pm} run lint`,
      format: `ldesign format`,
      docs: `ldesign docs`,
      changelog: `ldesign changelog`,
      deps: `ldesign deps`,
      security: `ldesign security`,
      performance: `ldesign performance`,
      deploy: `ldesign deploy`,
      publish: `ldesign publish`,
    }

    let commandLine = commandMap[command] || command
    
    // 如果是 dev 或 build 命令且指定了环境，添加 --environment 参数（适用于 @ldesign/launcher）
    if ((command === 'dev' || command === 'build') && environment) {
      const validEnvironments = ['development', 'production', 'test', 'staging', 'preview']
      if (validEnvironments.includes(environment)) {
        commandLine = `${commandLine} --environment ${environment}`
        this.logger.log(`[BuildCommandLine] 添加环境参数: --environment ${environment}`)
      } else {
        this.logger.warn(`[BuildCommandLine] 无效的环境参数: ${environment}`)
      }
    }

    this.logger.log(`[BuildCommandLine] 最终命令: ${commandLine}`)
    return commandLine
  }

  /**
 * API Operation
 */
  private async runCommand(
    execution: CommandExecution,
    project: Project,
  ): Promise<void> {
    this.logger.log(`[RunCommand] 开始运行命令: executionId=${execution.id}, command=${execution.command}, environment=${execution.environment || 'none'}`)
    
    const commandLine = execution.commandLine
    const [command, ...args] = commandLine.split(' ')

    this.logger.log(`[RunCommand] 执行命令: ${commandLine} (项目: ${project.name})`)
    this.logger.log(`[RunCommand] 工作目录: ${project.path}`)
    this.logger.log(`[RunCommand] 命令: ${command}, 参数: ${args.join(' ')}`)

    try {
      const childProcess = spawn(command, args, {
        cwd: project.path,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          FORCE_COLOR: '1',
          // 禁用输出缓冲，确保实时输出
          NODE_ENV: process.env.NODE_ENV || 'development',
          CI: 'false', // 确保不使用 CI 模式（CI 模式可能禁用颜色和实时输出）
          // 强制 Node.js 不使用缓冲输出
          NODE_OPTIONS: (process.env.NODE_OPTIONS || '') + ' --no-warnings',
          // Python 无缓冲（如果使用 Python）
          PYTHONUNBUFFERED: '1',
        },
      })

      this.logger.log(`[RunCommand] 进程已启动: PID=${childProcess.pid}, executionId=${execution.id}`)

    // 确保进程输出被正确捕获
    if (!childProcess.stdout) {
      this.logger.error(`[RunCommand] 无法获取 stdout: executionId=${execution.id}`)
      throw new Error(`Failed to get stdout for execution ${execution.id}`)
    }
    if (!childProcess.stderr) {
      this.logger.error(`[RunCommand] 无法获取 stderr: executionId=${execution.id}`)
      throw new Error(`Failed to get stderr for execution ${execution.id}`)
    }
    this.logger.log(`[RunCommand] stdout 和 stderr 已获取: executionId=${execution.id}`)

    // 设置输出流为无缓冲模式（如果可能）
    if (childProcess.stdout.setEncoding) {
      childProcess.stdout.setEncoding('utf8')
    }
    if (childProcess.stderr.setEncoding) {
      childProcess.stderr.setEncoding('utf8')
    }

    // 关键：立即设置监听器，确保不会错过任何输出
    // 在设置监听器之前，先确保流处于流动模式（flowing mode）
    // 如果流还没有被读取，它会自动进入流动模式
    childProcess.stdout?.resume()
    childProcess.stderr?.resume()
    this.logger.log(`[RunCommand] 输出流已设置为流动模式: executionId=${execution.id}`)

    // 立即设置监听器（在进程开始输出之前）
    let outputBuffer = execution.output || ''
    let serviceUrl: string | undefined

    // 准备房间名称（提前准备，避免在监听器中重复计算）
    const room = `project:${project.id}:command:${execution.command}`
    
    // 超时机制和心跳检测相关变量
    let lastOutputTime = Date.now()
    let heartbeatInterval: NodeJS.Timeout | null = null
    let timeoutTimer: NodeJS.Timeout | null = null

    // 防抖保存：避免频繁写入数据库，但确保重要日志立即保存
    let saveTimeout: NodeJS.Timeout | null = null
    let pendingSave: Partial<CommandExecution> | null = null
    
    const debouncedSave = (updates: Partial<CommandExecution>) => {
      // 合并更新
      if (pendingSave) {
        pendingSave = { ...pendingSave, ...updates }
      } else {
        pendingSave = { ...updates }
      }
      
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
      
      saveTimeout = setTimeout(async () => {
        if (!pendingSave) return
        
        try {
          const updatesToSave = { ...pendingSave }
          pendingSave = null
          
          this.logger.log(`[Database] Saving execution ${execution.id}, output length: ${updatesToSave.output?.length || 0}`)
          await this.updateExecution(execution.id, updatesToSave)
          this.logger.log(`[Database] Saved execution ${execution.id} successfully`)
        } catch (err: any) {
          // 如果记录已被删除（用户停止），忽略更新错误
          if (err.code !== 'SQLITE_CONSTRAINT' && !err.message?.includes('not found')) {
            this.logger.error(`Failed to update execution ${execution.id}: ${err.message}`)
          } else {
            this.logger.debug(`[Database] Execution ${execution.id} already deleted, skipping update`)
          }
        }
      }, 100) // 100ms 防抖，更快地保存日志，确保前端能及时获取
    }
    
    // 强制立即保存（用于重要日志）
    const forceSave = async (updates: Partial<CommandExecution>) => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
        saveTimeout = null
      }
      
      if (pendingSave) {
        updates = { ...pendingSave, ...updates }
        pendingSave = null
      }
      
      try {
        this.logger.debug(`[Database] Force saving execution ${execution.id}, output length: ${updates.output?.length || 0}`)
        await this.updateExecution(execution.id, updates)
        this.logger.debug(`[Database] Force saved execution ${execution.id} successfully`)
      } catch (err: any) {
        if (err.code !== 'SQLITE_CONSTRAINT' && !err.message?.includes('not found')) {
          this.logger.error(`Failed to force save execution ${execution.id}: ${err.message}`)
        }
      }
    }

    // Operation - 立即设置 stdout 监听器（必须在进程开始输出之前）
    this.logger.log(`[RunCommand] 设置 stdout 监听器: executionId=${execution.id}`)
    childProcess.stdout?.on('data', (data: Buffer) => {
      // 更新最后输出时间
      lastOutputTime = Date.now()
      
      const text = data.toString()
      outputBuffer += text
      
      // 调试日志：记录接收到的数据
      this.logger.log(`[Stdout] Execution ${execution.id} received ${text.length} bytes: ${text.substring(0, 200).replace(/\n/g, '\\n')}`)
      
      // 检测服务地址（必须在广播之前检测，以便包含在广播数据中）
      if ((execution.command === 'dev' || execution.command === 'preview') && !serviceUrl) {
        // 预览服务器格式: • 本地: http://localhost:4174 或 • 网络: http://192.168.x.x:4174
        if (execution.command === 'preview') {
          // 1. 匹配预览服务器网络地址格式（优先）
          const previewNetworkMatch = text.match(/•\s*网络:\s*(http[s]?:\/\/[^\s│\|]+)/i)
          if (previewNetworkMatch) {
            serviceUrl = previewNetworkMatch[1].trim().replace(/\/$/, '') // 移除末尾的斜杠
            this.logger.log(`[ServiceUrl] 检测到预览服务器网络地址: ${serviceUrl}`)
            try {
              this.eventsGateway.broadcastToRoom(room, 'command:status', {
                executionId: execution.id,
                status: 'running',
                serviceUrl,
              })
              this.logger.log(`[ServiceUrl] 已广播服务地址: ${serviceUrl}`)
            } catch (error: any) {
              this.logger.error(`[ServiceUrl] 广播失败: ${error.message}`)
            }
          }
          // 2. 匹配预览服务器本地地址格式
          const previewLocalMatch = text.match(/•\s*本地:\s*(http[s]?:\/\/[^\s│\|]+)/i)
          if (previewLocalMatch && !serviceUrl) {
            serviceUrl = previewLocalMatch[1].trim().replace(/\/$/, '')
            this.logger.log(`[ServiceUrl] 检测到预览服务器本地地址: ${serviceUrl}`)
            try {
              this.eventsGateway.broadcastToRoom(room, 'command:status', {
                executionId: execution.id,
                status: 'running',
                serviceUrl,
              })
              this.logger.log(`[ServiceUrl] 已广播服务地址: ${serviceUrl}`)
            } catch (error: any) {
              this.logger.error(`[ServiceUrl] 广播失败: ${error.message}`)
            }
          }
        }
        
        // 匹配多种可能的服务地址格式（dev 和 preview 通用）
        // 1. Vite 格式: Local: http://localhost:5173/
        const viteMatch = text.match(/Local:\s*(http[s]?:\/\/[^\s]+)/i)
        if (viteMatch) {
          serviceUrl = viteMatch[1].replace(/\/$/, '') // 移除末尾的斜杠
          this.logger.log(`[ServiceUrl] 检测到 Vite 服务地址: ${serviceUrl}`)
          try {
            this.eventsGateway.broadcastToRoom(room, 'command:status', {
              executionId: execution.id,
              status: 'running',
              serviceUrl,
            })
            this.logger.log(`[ServiceUrl] 已广播服务地址: ${serviceUrl}`)
          } catch (error: any) {
            this.logger.error(`[ServiceUrl] 广播失败: ${error.message}`)
          }
        }
        // 2. Network 格式: Network: http://192.168.x.x:5173/
        const networkMatch = text.match(/Network:\s*(http[s]?:\/\/[^\s]+)/i)
        if (networkMatch && !serviceUrl) {
          serviceUrl = networkMatch[1].replace(/\/$/, '')
          this.logger.log(`[ServiceUrl] 检测到 Network 服务地址: ${serviceUrl}`)
          try {
            this.eventsGateway.broadcastToRoom(room, 'command:status', {
              executionId: execution.id,
              status: 'running',
              serviceUrl,
            })
            this.logger.log(`[ServiceUrl] 已广播服务地址: ${serviceUrl}`)
          } catch (error: any) {
            this.logger.error(`[ServiceUrl] 广播失败: ${error.message}`)
          }
        }
        // 3. 通用端口匹配: localhost:5173 或 127.0.0.1:5173 或 0.0.0.0:5173
        const urlMatch = text.match(/(?:http[s]?:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0)[:\s]+(\d+)/)
        if (urlMatch && !serviceUrl) {
          const port = urlMatch[1]
          serviceUrl = `http://localhost:${port}`
          this.logger.log(`[ServiceUrl] 检测到端口号，生成服务地址: ${serviceUrl}`)
          try {
            this.eventsGateway.broadcastToRoom(room, 'command:status', {
              executionId: execution.id,
              status: 'running',
              serviceUrl,
            })
            this.logger.log(`[ServiceUrl] 已广播服务地址: ${serviceUrl}`)
          } catch (error: any) {
            this.logger.error(`[ServiceUrl] 广播失败: ${error.message}`)
          }
        }
        // 4. Angular 格式: Application server started on http://localhost:4200/
        const angularMatch = text.match(/Application server started on\s+(http[s]?:\/\/[^\s]+)/i)
        if (angularMatch && !serviceUrl) {
          serviceUrl = angularMatch[1].replace(/\/$/, '')
          this.logger.log(`[ServiceUrl] 检测到 Angular 服务地址: ${serviceUrl}`)
          try {
            this.eventsGateway.broadcastToRoom(room, 'command:status', {
              executionId: execution.id,
              status: 'running',
              serviceUrl,
            })
            this.logger.log(`[ServiceUrl] 已广播服务地址: ${serviceUrl}`)
          } catch (error: any) {
            this.logger.error(`[ServiceUrl] 广播失败: ${error.message}`)
          }
        }
        // 5. 其他常见格式: Server running at http://localhost:3000
        const serverMatch = text.match(/Server running at\s+(http[s]?:\/\/[^\s]+)/i)
        if (serverMatch && !serviceUrl) {
          serviceUrl = serverMatch[1].replace(/\/$/, '')
          this.logger.log(`[ServiceUrl] 检测到 Server 服务地址: ${serviceUrl}`)
          try {
            this.eventsGateway.broadcastToRoom(room, 'command:status', {
              executionId: execution.id,
              status: 'running',
              serviceUrl,
            })
            this.logger.log(`[ServiceUrl] 已广播服务地址: ${serviceUrl}`)
          } catch (error: any) {
            this.logger.error(`[ServiceUrl] 广播失败: ${error.message}`)
          }
        }
      }

      // 立即广播到 WebSocket（同步，不等待，不阻塞）
      // 如果 WebSocket 未初始化，静默失败（不记录警告，避免日志噪音）
      try {
        this.logger.log(`[Broadcast] 广播 stdout 到房间 ${room}, executionId: ${execution.id}, data length: ${text.length}`)
        this.eventsGateway.broadcastToRoom(room, 'command:output', {
          executionId: execution.id,
          data: text,
          serviceUrl,
        })
        this.logger.log(`[Broadcast] stdout 广播完成: room=${room}, executionId=${execution.id}`)
      } catch (error: any) {
        this.logger.error(`[Broadcast] stdout 广播失败: room=${room}, executionId=${execution.id}, error=${error.message}, stack=${error.stack}`)
      }

      // 保存日志到数据库（异步，不阻塞）
      debouncedSave({
        output: outputBuffer,
        serviceUrl,
      })
    })

    // Operation - 立即设置 stderr 监听器
    this.logger.log(`[RunCommand] 设置 stderr 监听器: executionId=${execution.id}`)
    childProcess.stderr?.on('data', (data: Buffer) => {
      // 更新最后输出时间
      lastOutputTime = Date.now()
      
      const text = data.toString()
      outputBuffer += text

      // 调试日志：记录接收到的错误数据
      this.logger.log(`[Stderr] Execution ${execution.id} received ${text.length} bytes: ${text.substring(0, 200).replace(/\n/g, '\\n')}`)

      // 立即广播到 WebSocket（同步，不等待，不阻塞）
      try {
        this.logger.log(`[Broadcast] 广播 stderr 到房间 ${room}, executionId: ${execution.id}, data length: ${text.length}`)
        this.eventsGateway.broadcastToRoom(room, 'command:error', {
          executionId: execution.id,
          data: text,
        })
        this.logger.log(`[Broadcast] stderr 广播完成: room=${room}, executionId=${execution.id}`)
      } catch (error: any) {
        this.logger.error(`[Broadcast] stderr 广播失败: room=${room}, executionId=${execution.id}, error=${error.message}, stack=${error.stack}`)
      }

      // 保存日志到数据库（异步，不阻塞）
      debouncedSave({
        output: outputBuffer,
      })
    })

    this.logger.log(`[RunCommand] 进程已完全启动: executionId=${execution.id}, PID=${childProcess.pid}, command=${commandLine}`)

    // Operation
    this.runningProcesses.set(execution.id, childProcess)
    this.logger.log(`[RunCommand] 进程已添加到运行列表: executionId=${execution.id}, 当前运行进程数=${this.runningProcesses.size}`)

    // Operation
    this.logger.log(`[RunCommand] 设置 exit 事件监听器: executionId=${execution.id}`)
    childProcess.on('exit', async (code) => {
      // 清理定时器
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
      if (timeoutTimer) {
        clearTimeout(timeoutTimer)
        timeoutTimer = null
      }
      
      this.logger.log(`[Exit] 进程退出: executionId=${execution.id}, exitCode=${code}`)
      // 首先检查记录是否还存在（可能已被 stopCommand 删除）
      const executionExists = await this.commandExecutionRepository.findOne({
        where: { id: execution.id },
        cache: false,
      })

      if (!executionExists) {
        // 记录已被删除（可能是用户手动停止），直接返回
        this.logger.log(`[Exit] 执行记录已被删除，跳过处理: ${execution.id}`)
        this.runningProcesses.delete(execution.id)
        return
      }

      // 清除防抖定时器并强制保存所有日志
      if (saveTimeout) {
        clearTimeout(saveTimeout)
        saveTimeout = null
      }

      // 最后一次强制保存所有日志（确保所有日志都被保存）
      const completedAt = Date.now()
      const duration = completedAt - execution.createdAt
      
      await forceSave({
        output: outputBuffer,
        status: code === 0 ? 'completed' : 'failed',
        completedAt,
        duration,
        pid: undefined,
      })

      this.runningProcesses.delete(execution.id)

      const status: CommandStatus = code === 0 ? 'completed' : 'failed'
      
      // 再次检查记录是否存在（防止在保存过程中被删除）
      const executionStillExists = await this.commandExecutionRepository.findOne({
        where: { id: execution.id },
        cache: false,
      })

      if (!executionStillExists) {
        // 记录在保存过程中被删除，直接返回
        this.logger.log(`[Exit] 执行记录在保存过程中被删除: ${execution.id}`)
        return
      }
      
      // 先发送完成状态更新（确保前端能收到）
      const room = `project:${project.id}:command:${execution.command}`
      try {
        this.eventsGateway.broadcastToRoom(room, 'command:status', {
          executionId: execution.id,
          status,
          serviceUrl: serviceUrl,
        })
        this.logger.log(`[Exit] 已广播完成状态: executionId=${execution.id}, status=${status}`)
      } catch (error: any) {
        this.logger.error(`[Exit] 广播完成状态失败: ${error.message}`)
      }
      
      // 保留历史记录，不删除（只更新状态为 completed 或 failed）
      // 这样可以在服务重启后仍然查看历史执行记录
      this.logger.log(`Command execution ${execution.id} completed with status: ${status}, code: ${code}, 记录已保留在数据库中`)
    })

    // 添加一个延迟检查，确认进程是否真的在运行
    setTimeout(() => {
      if (childProcess.killed) {
        this.logger.warn(`[RunCommand] 进程已被杀死: executionId=${execution.id}, PID=${childProcess.pid}`)
      } else if (childProcess.exitCode !== null) {
        this.logger.warn(`[RunCommand] 进程已退出: executionId=${execution.id}, PID=${childProcess.pid}, exitCode=${childProcess.exitCode}`)
      } else {
        this.logger.log(`[RunCommand] 进程运行正常: executionId=${execution.id}, PID=${childProcess.pid}`)
      }
    }, 1000)

    // 心跳检测：每30秒检查一次进程状态和日志输出
    heartbeatInterval = setInterval(() => {
      const timeSinceLastOutput = Date.now() - lastOutputTime
      const isProcessAlive = !childProcess.killed && childProcess.exitCode === null
      
      // 检查进程是否还在运行
      if (!isProcessAlive) {
        this.logger.log(`[Heartbeat] 进程已退出: executionId=${execution.id}, PID=${childProcess.pid}`)
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
          heartbeatInterval = null
        }
        if (timeoutTimer) {
          clearTimeout(timeoutTimer)
          timeoutTimer = null
        }
        return
      }
      
      // 如果超过5分钟没有日志输出，认为可能卡住了
      if (timeSinceLastOutput > 5 * 60 * 1000) {
        this.logger.warn(`[Heartbeat] 进程可能卡住: executionId=${execution.id}, PID=${childProcess.pid}, 已 ${Math.floor(timeSinceLastOutput / 1000)} 秒无输出`)
        
        // 发送警告日志
        const warningMessage = `\n⚠️  警告: 进程已超过 ${Math.floor(timeSinceLastOutput / 1000)} 秒没有输出，可能已卡住\n`
        outputBuffer += warningMessage
        
        try {
          this.eventsGateway.broadcastToRoom(room, 'command:output', {
            executionId: execution.id,
            data: warningMessage,
          })
        } catch (error: any) {
          this.logger.error(`[Heartbeat] 广播警告失败: ${error.message}`)
        }
      }
    }, 30 * 1000) // 每30秒检查一次
    
    // 超时机制：如果超过30分钟没有完成，强制终止
    const maxExecutionTime = 30 * 60 * 1000 // 30分钟
    timeoutTimer = setTimeout(async () => {
      if (!childProcess.killed && childProcess.exitCode === null) {
        this.logger.warn(`[Timeout] 执行超时，强制终止进程: executionId=${execution.id}, PID=${childProcess.pid}`)
        
        const timeoutMessage = `\n⏱️  执行超时（超过 ${maxExecutionTime / 1000 / 60} 分钟），正在终止进程...\n`
        outputBuffer += timeoutMessage
        
        try {
          this.eventsGateway.broadcastToRoom(room, 'command:error', {
            executionId: execution.id,
            data: timeoutMessage,
          })
        } catch (error: any) {
          this.logger.error(`[Timeout] 广播超时消息失败: ${error.message}`)
        }
        
        // 强制终止进程
        try {
          childProcess.kill('SIGTERM')
          setTimeout(() => {
            if (!childProcess.killed && childProcess.exitCode === null) {
              childProcess.kill('SIGKILL')
            }
          }, 5000)
        } catch (error: any) {
          this.logger.error(`[Timeout] 终止进程失败: ${error.message}`)
        }
      }
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
    }, maxExecutionTime)

    // Operation
    this.logger.log(`[RunCommand] 设置 error 事件监听器: executionId=${execution.id}`)
    childProcess.on('error', (error) => {
      this.logger.error(`[Error] 进程错误: executionId=${execution.id}, error=${error.message}, stack=${error.stack}`)
      // 检查记录是否还存在
      this.commandExecutionRepository.findOne({
        where: { id: execution.id },
        cache: false,
      }).then(async (executionExists) => {
        if (!executionExists) {
          // 记录已被删除，直接返回
          this.runningProcesses.delete(execution.id)
          return
        }

        this.runningProcesses.delete(execution.id)

        // 更新执行记录状态为 failed，保留历史记录
        const failedAt = Date.now()
        const duration = failedAt - execution.createdAt
        
        await this.updateExecution(execution.id, {
          status: 'failed',
          error: error.message,
          completedAt: failedAt,
          duration,
          pid: undefined,
        }).catch(err => 
          this.logger.error(`Failed to update execution ${execution.id} status: ${err.message}`)
        )

        // Operation
        const room = `project:${project.id}:command:${execution.command}`
        this.eventsGateway.broadcastToRoom(room, 'command:error', {
          executionId: execution.id,
          error: error.message,
        })
      }).catch(err => {
        this.logger.error(`Error checking execution ${execution.id}: ${err.message}`)
        this.runningProcesses.delete(execution.id)
      })
    })

    // Operation
    await this.updateExecution(execution.id, {
      pid: childProcess.pid,
    })
    this.logger.log(`[RunCommand] 执行记录已更新 PID: executionId=${execution.id}, PID=${childProcess.pid}`)
    } catch (error: any) {
      this.logger.error(`[RunCommand] 运行命令失败: executionId=${execution.id}, error=${error.message}, stack=${error.stack}`)
      
      // 更新执行记录为失败状态
      try {
        const failedAt = Date.now()
        const duration = failedAt - execution.createdAt
        
        await this.updateExecution(execution.id, {
          status: 'failed',
          completedAt: failedAt,
          duration,
        })
        
        // 广播失败状态
        const room = `project:${project.id}:command:${execution.command}`
        this.eventsGateway.broadcastToRoom(room, 'command:status', {
          executionId: execution.id,
          status: 'failed',
        })
      } catch (updateError: any) {
        this.logger.error(`[RunCommand] 更新失败状态失败: executionId=${execution.id}, error=${updateError.message}`)
      }
      
      // 从运行列表中移除
      this.runningProcesses.delete(execution.id)
    }
  }

  /**
 * API Operation
 */
  private async updateExecution(
    id: string,
    updates: Partial<CommandExecution>,
  ): Promise<void> {
    await this.commandExecutionRepository.update(id, {
      ...updates,
      updatedAt: Date.now(),
    })
  }

  /**
 * API Operation
 */
  async stopCommand(executionId: string): Promise<void> {
    this.logger.log(`[Stop] 开始停止命令执行: ${executionId}`)
    
    const execution = await this.commandExecutionRepository.findOne({
      where: { id: executionId },
      cache: false,
    })

    if (!execution) {
      // 记录可能已经被删除，直接返回
      this.logger.log(`[Stop] 执行记录不存在: ${executionId}`)
      return
    }

    if (execution.status !== 'running') {
      this.logger.warn(`[Stop] 命令状态不是运行中: ${execution.status}`)
      throw new Error(`Command ${execution.command} is not running`)
    }

    // 先从 Map 中移除，防止进程退出时再次处理
    const process = this.runningProcesses.get(executionId)
    if (process) {
      this.logger.log(`[Stop] 找到进程，准备停止: PID ${process.pid}`)
      
      // 移除所有事件监听器，防止进程退出时更新记录
      process.removeAllListeners('exit')
      process.removeAllListeners('error')
      process.stdout?.removeAllListeners('data')
      process.stderr?.removeAllListeners('data')
      
      // 立即标记为已停止，防止后续事件处理器执行
      this.runningProcesses.delete(executionId)
      
      // 停止进程
      try {
        this.logger.log(`[Stop] 发送 SIGTERM 信号`)
        process.kill('SIGTERM')
        
        // 等待进程完全退出（最多等待2秒）
        await new Promise<void>((resolve) => {
          if (process.killed || process.exitCode !== null) {
            this.logger.log(`[Stop] 进程已退出`)
            resolve()
            return
          }
          
          const timeout = setTimeout(() => {
            // 超时后强制杀死
            this.logger.warn(`[Stop] 进程未在2秒内退出，强制杀死`)
            try {
              process.kill('SIGKILL')
            } catch (e) {
              // 忽略错误
            }
            resolve()
          }, 2000)
          
          process.once('exit', () => {
            clearTimeout(timeout)
            this.logger.log(`[Stop] 进程退出事件触发`)
            resolve()
          })
        })
      } catch (error: any) {
        this.logger.warn(`Failed to kill process for execution ${executionId}: ${error.message}`)
        // 即使杀死失败，也继续删除记录
      }
    } else {
      this.logger.warn(`[Stop] 未找到进程: ${executionId}`)
    }

    // 再次确认记录状态（防止并发问题）
    const executionCheck = await this.commandExecutionRepository.findOne({
      where: { id: executionId },
      cache: false,
    })

    if (!executionCheck) {
      // 记录已经被删除（可能是其他地方删除的），直接返回
      this.logger.log(`[Stop] 执行记录已被删除: ${executionId}`)
      return
    }

    if (executionCheck.status !== 'running') {
      // 状态已经不是 running，说明可能已经被其他地方处理了
      this.logger.log(`[Stop] 执行记录状态已改变: ${executionCheck.status}`)
      // 如果状态不是 running，说明已经完成或失败，不需要再处理
      return
    }

    // 发送停止状态更新（如果 WebSocket 不可用，记录警告但不抛出错误）
    const room = `project:${execution.projectId}:command:${execution.command}`
    try {
      this.eventsGateway.broadcastToRoom(room, 'command:status', {
        executionId: execution.id,
        status: 'stopped',
        serviceUrl: null,
      })
    } catch (error: any) {
      this.logger.warn(`Failed to broadcast stop status for execution ${executionId}: ${error.message}`)
      // 继续执行，不抛出错误
    }

    // 更新执行记录状态为 stopped，保留历史记录
    try {
      const completedAt = Date.now()
      const execution = await this.commandExecutionRepository.findOne({
        where: { id: executionId },
        cache: false,
      })
      
      if (execution) {
        const duration = completedAt - execution.createdAt
        await this.updateExecution(executionId, {
          status: 'stopped',
          completedAt,
          duration,
          pid: undefined,
        })
        this.logger.log(`[Stop] 已更新执行记录状态为 stopped: ${executionId}, 耗时: ${duration}ms`)
      }
    } catch (error: any) {
      this.logger.error(`[Stop] 更新执行记录失败: ${error.message}`)
    }
  }

  /**
 * API Operation
 */
  async getLatestExecution(projectId: string, command: string, environment?: string): Promise<CommandExecution | null> {
    // 只返回正在运行的执行记录，禁用缓存确保实时数据
    const queryBuilder = this.commandExecutionRepository.createQueryBuilder('execution')
      .where('execution.projectId = :projectId', { projectId })
      .andWhere('execution.command = :command', { command })
      .andWhere('execution.status = :status', { status: 'running' })
      .orderBy('execution.createdAt', 'DESC')
      .cache(false)
    
    // 如果指定了环境，只返回该环境的记录
    if (environment) {
      queryBuilder.andWhere('execution.environment = :environment', { environment })
    }
    
    return queryBuilder.getOne()
  }

  /**
   * 获取项目的所有运行中的命令执行记录（按环境分组）
   */
  async getRunningExecutions(projectId: string, command?: string): Promise<CommandExecution[]> {
    const where: any = {
      projectId,
      status: 'running',
    }
    if (command) {
      where.command = command
    }

    return this.commandExecutionRepository.find({
      where,
      order: { createdAt: 'DESC' },
      cache: false,
    })
  }

  /**
   * 清除项目的所有执行记录（用于关闭服务时清理）
   * @param projectId - 项目 ID
   * @param command - 命令名称（可选）
   */
  async clearExecutions(projectId: string, command?: string): Promise<void> {
    const where: any = { projectId }
    if (command) {
      where.command = command
    }

    // 停止所有正在运行的进程
    const runningExecutions = await this.commandExecutionRepository.find({
      where: { ...where, status: 'running' },
      cache: false,
    })

    for (const execution of runningExecutions) {
      const process = this.runningProcesses.get(execution.id)
      if (process) {
        process.kill('SIGTERM')
        this.runningProcesses.delete(execution.id)
      }
    }

    // 删除所有执行记录
    await this.commandExecutionRepository.delete(where)
    
    this.logger.log(`Cleared all executions for project ${projectId}${command ? ` command ${command}` : ''}`)
  }

  /**
 * API Operation
 */
  /**
   * 获取项目的所有执行记录（包括历史记录）
   * @param projectId - 项目 ID
   * @param command - 命令名称（可选）
   * @param status - 状态筛选（可选）
   * @param limit - 返回记录数限制（默认 50）
   * @returns 执行记录列表
   */
  async getExecutions(
    projectId: string,
    command?: string,
    status?: CommandStatus,
    limit: number = 50,
  ): Promise<CommandExecution[]> {
    const where: any = { projectId }
    if (command) {
      where.command = command
    }
    if (status) {
      where.status = status
    }

    return this.commandExecutionRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      cache: false, // 禁用缓存，确保获取最新数据
    })
  }

  /**
   * 获取项目的历史执行记录（已完成、失败、停止的记录）
   * @param projectId - 项目 ID
   * @param command - 命令名称（可选）
   * @param limit - 返回记录数限制（默认 100）
   * @returns 历史执行记录列表
   */
  async getHistoryExecutions(
    projectId: string,
    command?: string,
    limit: number = 100,
  ): Promise<CommandExecution[]> {
    const where: any = {
      projectId,
      status: In(['completed', 'failed', 'stopped']),
    }
    if (command) {
      where.command = command
    }

    return this.commandExecutionRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
      cache: false,
    })
  }
}

