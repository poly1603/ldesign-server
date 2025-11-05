import { Injectable, Logger, NotFoundException, Inject, forwardRef, OnApplicationShutdown } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'crypto'
import { Project } from './entities/project.entity.js'
import { CommandExecution, type CommandStatus } from './entities/command-execution.entity.js'
import { EventsGateway } from '../../common/websocket/events.gateway.js'

/**
 * API Operation
 */
@Injectable()
export class ProjectCommandService implements OnApplicationShutdown {
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
  ): Promise<CommandExecution> {
    // Operation
    const project = await this.projectRepository.findOne({ where: { id: projectId }, cache: false })
    if (!project) {
      throw new NotFoundException(` ${projectId} `)
    }

    // Operation
    const existing = await this.commandExecutionRepository.findOne({
      where: {
        projectId,
        command,
        status: 'running',
      },
      order: { createdAt: 'DESC' },
      cache: false,
    })

    if (existing) {
      throw new Error(` ${command} `)
    }

    // Operation
    const execution = this.commandExecutionRepository.create({
      id: randomUUID(),
      projectId,
      command,
      commandLine: this.buildCommandLine(project, command),
      status: 'running',
      output: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    await this.commandExecutionRepository.save(execution)

    // Operation
    this.runCommand(execution, project)

    return execution
  }

  /**
 * API Operation
 */
  private buildCommandLine(project: Project, command: string): string {
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

    return commandMap[command] || command
  }

  /**
 * API Operation
 */
  private async runCommand(
    execution: CommandExecution,
    project: Project,
  ): Promise<void> {
    const commandLine = execution.commandLine
    const [command, ...args] = commandLine.split(' ')

    this.logger.log(`: ${commandLine} (: ${project.name})`)

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

    // 确保进程输出被正确捕获
    if (!childProcess.stdout) {
      this.logger.error(`Failed to get stdout for execution ${execution.id}`)
      throw new Error(`Failed to get stdout for execution ${execution.id}`)
    }
    if (!childProcess.stderr) {
      this.logger.error(`Failed to get stderr for execution ${execution.id}`)
      throw new Error(`Failed to get stderr for execution ${execution.id}`)
    }

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

    // 立即设置监听器（在进程开始输出之前）
    let outputBuffer = execution.output || ''
    let serviceUrl: string | undefined

    // 准备房间名称（提前准备，避免在监听器中重复计算）
    const room = `project:${project.id}:command:${execution.command}`

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
      }, 200) // 200ms 防抖，更快地保存日志
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
    childProcess.stdout?.on('data', (data: Buffer) => {
      const text = data.toString()
      outputBuffer += text
      
      // 调试日志：记录接收到的数据
      this.logger.debug(`[Stdout] Execution ${execution.id} received ${text.length} bytes: ${text.substring(0, 100)}...`)
      
      // 检测服务地址（必须在广播之前检测，以便包含在广播数据中）
      if (execution.command === 'dev' && !serviceUrl) {
        // 匹配多种可能的服务地址格式
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
        this.logger.debug(`[Broadcast] Broadcasting to room ${room}, executionId: ${execution.id}, data length: ${text.length}`)
        this.eventsGateway.broadcastToRoom(room, 'command:output', {
          executionId: execution.id,
          data: text,
          serviceUrl,
        })
        this.logger.debug(`[Broadcast] Broadcast completed for room ${room}`)
      } catch (error: any) {
        this.logger.error(`[Broadcast] Failed to broadcast to room ${room}: ${error.message}`)
      }

      // 保存日志到数据库（异步，不阻塞）
      debouncedSave({
        output: outputBuffer,
        serviceUrl,
      })
    })

    // Operation - 立即设置 stderr 监听器
    childProcess.stderr?.on('data', (data: Buffer) => {
      const text = data.toString()
      outputBuffer += text

      // 调试日志：记录接收到的错误数据
      this.logger.debug(`[Stderr] Execution ${execution.id} received ${text.length} bytes: ${text.substring(0, 100)}...`)

      // 立即广播到 WebSocket（同步，不等待，不阻塞）
      try {
        this.logger.debug(`[Broadcast] Broadcasting error to room ${room}, executionId: ${execution.id}, data length: ${text.length}`)
        this.eventsGateway.broadcastToRoom(room, 'command:error', {
          executionId: execution.id,
          data: text,
        })
        this.logger.debug(`[Broadcast] Error broadcast completed for room ${room}`)
      } catch (error: any) {
        this.logger.error(`[Broadcast] Failed to broadcast error to room ${room}: ${error.message}`)
      }

      // 保存日志到数据库（异步，不阻塞）
      debouncedSave({
        output: outputBuffer,
      })
    })

    this.logger.log(`Started process for execution ${execution.id}, PID: ${childProcess.pid}, command: ${commandLine}`)

    // Operation
    this.runningProcesses.set(execution.id, childProcess)

    // Operation
    childProcess.on('exit', async (code) => {
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
      await forceSave({
        output: outputBuffer,
        status: code === 0 ? 'completed' : 'failed',
        completedAt: Date.now(),
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
      
      // 删除执行记录（不保留已完成或失败的记录）
      await this.commandExecutionRepository.delete(execution.id).catch(err => 
        this.logger.error(`Failed to delete execution ${execution.id}: ${err.message}`)
      )

      // 发送完成状态更新
      const room = `project:${project.id}:command:${execution.command}`
      this.eventsGateway.broadcastToRoom(room, 'command:status', {
        executionId: execution.id,
        status,
        serviceUrl: serviceUrl,
      })

      this.logger.log(`Command execution ${execution.id} completed with status: ${status}, code: ${code}`)
    })

    // Operation
    childProcess.on('error', (error) => {
      // 检查记录是否还存在
      this.commandExecutionRepository.findOne({
        where: { id: execution.id },
        cache: false,
      }).then(executionExists => {
        if (!executionExists) {
          // 记录已被删除，直接返回
          this.runningProcesses.delete(execution.id)
          return
        }

        this.runningProcesses.delete(execution.id)

        // 删除执行记录
        this.commandExecutionRepository.delete(execution.id).catch(err => 
          this.logger.error(`Failed to delete execution ${execution.id}: ${err.message}`)
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
      // 但还是要删除记录，确保清理
      await this.commandExecutionRepository.delete(executionId)
      this.logger.log(`[Stop] 已删除状态为 ${executionCheck.status} 的记录`)
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

    // 清除执行记录（删除数据库记录）
    try {
      await this.commandExecutionRepository.delete(executionId)
      this.logger.log(`[Stop] 已删除执行记录: ${executionId}`)
      
      // 验证删除是否成功（禁用缓存，确保查询最新数据）
      // 注意：由于 TypeORM 的查询缓存，可能需要等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const verifyDelete = await this.commandExecutionRepository.findOne({
        where: { id: executionId },
        cache: false, // 禁用查询缓存
      })
      
      if (verifyDelete) {
        this.logger.warn(`[Stop] 记录仍存在，尝试强制删除: ${executionId}`)
        // 尝试使用 remove 方法
        try {
          await this.commandExecutionRepository.remove(verifyDelete)
          this.logger.log(`[Stop] 使用 remove 方法删除成功`)
        } catch (err: any) {
          this.logger.warn(`[Stop] remove 方法失败，尝试 QueryBuilder: ${err.message}`)
          // 使用 QueryBuilder 直接删除
          await this.commandExecutionRepository
            .createQueryBuilder()
            .delete()
            .from(CommandExecution)
            .where('id = :id', { id: executionId })
            .execute()
          this.logger.log(`[Stop] 使用 QueryBuilder 删除成功`)
        }
      } else {
        this.logger.log(`[Stop] 确认执行记录已删除: ${executionId}`)
      }

      // 清理查询缓存，确保后续查询不会命中旧数据
      try {
        const queryResultCache = this.commandExecutionRepository.manager.connection?.queryResultCache
        await queryResultCache?.clear()
      } catch (cacheError: any) {
        this.logger.warn(`[Stop] 清理查询缓存失败: ${cacheError.message}`)
      }
    } catch (error: any) {
      this.logger.error(`[Stop] 删除执行记录失败: ${error.message}`)
      // 即使删除失败，也继续执行（记录可能已经不存在）
      // 尝试使用 QueryBuilder 作为最后手段
      try {
        await this.commandExecutionRepository
          .createQueryBuilder()
          .delete()
          .from(CommandExecution)
          .where('id = :id', { id: executionId })
          .execute()
        this.logger.log(`[Stop] 使用 QueryBuilder 删除成功（异常恢复）`)
      } catch (err: any) {
        this.logger.error(`[Stop] QueryBuilder 删除也失败: ${err.message}`)
      }
    }
  }

  /**
 * API Operation
 */
  async getLatestExecution(projectId: string, command: string): Promise<CommandExecution | null> {
    // 只返回正在运行的执行记录，禁用缓存确保实时数据
    return this.commandExecutionRepository.createQueryBuilder('execution')
      .where('execution.projectId = :projectId', { projectId })
      .andWhere('execution.command = :command', { command })
      .andWhere('execution.status = :status', { status: 'running' })
      .orderBy('execution.createdAt', 'DESC')
      .cache(false)
      .getOne()
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
  async getExecutions(projectId: string, command?: string): Promise<CommandExecution[]> {
    const where: any = { projectId }
    if (command) {
      where.command = command
    }

    return this.commandExecutionRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 10,
    })
  }
}

