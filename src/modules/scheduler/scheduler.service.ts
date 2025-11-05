import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import {
  CreateJobDto,
  UpdateJobDto,
  ExecuteJobDto,
  ValidateCronDto,
  ListJobsDto,
  GetJobHistoryDto,
  GetJobLogsDto,
  JobStatus,
  JobType,
} from './dto/scheduler.dto.js'

interface Job {
  id: string
  name: string
  type: JobType
  status: JobStatus
  cronExpression?: string
  interval?: number
  startTime?: string
  data: Record<string, any>
  description?: string
  maxRetries?: number
  timeout?: number
  enabled: boolean
  createdAt: string
  lastRun?: string
  nextRun?: string
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name)
  private jobs: Map<string, Job> = new Map()
  private executionHistory: Map<string, any[]> = new Map()

  /**
 * API Operation
 */
  async createJob(createDto: CreateJobDto) {
    this.logger.log(`Creating job: ${createDto.name}`)

    const jobId = `job-${Date.now()}`
    const job: Job = {
      id: jobId,
      name: createDto.name,
      type: createDto.type,
      status: JobStatus.PENDING,
      cronExpression: createDto.cronExpression,
      interval: createDto.interval,
      startTime: createDto.startTime,
      data: createDto.data,
      description: createDto.description,
      maxRetries: createDto.maxRetries || 0,
      timeout: createDto.timeout,
      enabled: createDto.enabled !== false,
      createdAt: new Date().toISOString(),
      nextRun: this.calculateNextRun(createDto),
    }

    this.jobs.set(jobId, job)
    this.executionHistory.set(jobId, [])

    return {
      success: true,
      data: job,
      message: 'Job created successfully',
    }
  }

  /**
 * API Operation
 */
  async listJobs(listDto: ListJobsDto) {
    this.logger.log('Listing jobs')

    let jobs = Array.from(this.jobs.values())

    // Operation
    if (listDto.status) {
      jobs = jobs.filter(j => j.status === listDto.status)
    }
    if (listDto.type) {
      jobs = jobs.filter(j => j.type === listDto.type)
    }
    if (listDto.enabled !== undefined) {
      jobs = jobs.filter(j => j.enabled === listDto.enabled)
    }

    // Operation
    const page = listDto.page || 1
    const pageSize = listDto.pageSize || 20
    const start = (page - 1) * pageSize
    const paginatedJobs = jobs.slice(start, start + pageSize)

    return {
      success: true,
      data: {
        jobs: paginatedJobs,
        total: jobs.length,
        page,
        pageSize,
      },
    }
  }

  /**
 * API Operation
 */
  async getJob(jobId: string) {
    this.logger.log(`Getting job: ${jobId}`)

    const job = this.jobs.get(jobId)
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`)
    }

    return {
      success: true,
      data: job,
    }
  }

  /**
 * API Operation
 */
  async updateJob(jobId: string, updateDto: UpdateJobDto) {
    this.logger.log(`Updating job: ${jobId}`)

    const job = this.jobs.get(jobId)
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`)
    }

    Object.assign(job, {
      ...updateDto,
      nextRun: updateDto.cronExpression || updateDto.interval 
        ? this.calculateNextRun({ ...job, ...updateDto } as any)
        : job.nextRun,
    })

    this.jobs.set(jobId, job)

    return {
      success: true,
      data: job,
      message: 'Job updated successfully',
    }
  }

  /**
 * API Operation
 */
  async deleteJob(jobId: string) {
    this.logger.log(`Deleting job: ${jobId}`)

    if (!this.jobs.has(jobId)) {
      throw new NotFoundException(`Job ${jobId} not found`)
    }

    this.jobs.delete(jobId)
    this.executionHistory.delete(jobId)

    return {
      success: true,
      message: 'Job deleted successfully',
    }
  }

  /**
 * API Operation
 */
  async executeJob(executeDto: ExecuteJobDto) {
    this.logger.log(`Executing job: ${executeDto.jobId}`)

    const job = this.jobs.get(executeDto.jobId)
    if (!job) {
      throw new NotFoundException(`Job ${executeDto.jobId} not found`)
    }

    const executionId = `exec-${Date.now()}`
    const execution = {
      id: executionId,
      jobId: job.id,
      status: JobStatus.RUNNING,
      startedAt: new Date().toISOString(),
      data: executeDto.data || job.data,
    }

    // Operation
    job.status = JobStatus.RUNNING
    job.lastRun = execution.startedAt

    // Operation
    setTimeout(() => {
      execution.status = JobStatus.COMPLETED
      execution['completedAt'] = new Date().toISOString()
      execution['result'] = { success: true, message: 'Job executed successfully' }
      
      job.status = JobStatus.COMPLETED
      job.nextRun = this.calculateNextRun(job as any)
      
      const history = this.executionHistory.get(job.id) || []
      history.unshift(execution)
      this.executionHistory.set(job.id, history.slice(0, 100))
    }, 1000)

    return {
      success: true,
      data: execution,
      message: 'Job execution started',
    }
  }

  /**
 * API Operation
 */
  async pauseJob(jobId: string) {
    this.logger.log(`Pausing job: ${jobId}`)

    const job = this.jobs.get(jobId)
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`)
    }

    job.status = JobStatus.PAUSED
    job.enabled = false

    return {
      success: true,
      data: job,
      message: 'Job paused successfully',
    }
  }

  /**
 * API Operation
 */
  async resumeJob(jobId: string) {
    this.logger.log(`Resuming job: ${jobId}`)

    const job = this.jobs.get(jobId)
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`)
    }

    job.status = JobStatus.PENDING
    job.enabled = true
    job.nextRun = this.calculateNextRun(job as any)

    return {
      success: true,
      data: job,
      message: 'Job resumed successfully',
    }
  }

  /**
 * API Operation
 */
  async getJobHistory(historyDto: GetJobHistoryDto) {
    this.logger.log(`Getting history for job: ${historyDto.jobId}`)

    const history = this.executionHistory.get(historyDto.jobId) || []
    const limit = historyDto.limit || 50
    
    let filtered = history
    if (historyDto.status) {
      filtered = filtered.filter(h => h.status === historyDto.status)
    }

    return {
      success: true,
      data: {
        jobId: historyDto.jobId,
        history: filtered.slice(0, limit),
        total: filtered.length,
      },
    }
  }

  /**
 * API Operation
 */
  async getJobLogs(logsDto: GetJobLogsDto) {
    this.logger.log(`Getting logs for: ${logsDto.id}`)

    // Operation
    const logs = [
      { time: new Date().toISOString(), level: 'info', message: 'Job started' },
      { time: new Date().toISOString(), level: 'debug', message: 'Processing data' },
      { time: new Date().toISOString(), level: 'info', message: 'Job completed' },
    ]

    const limit = logsDto.limit || 100
    let filtered = logs
    if (logsDto.level) {
      filtered = filtered.filter(l => l.level === logsDto.level)
    }

    return {
      success: true,
      data: {
        id: logsDto.id,
        logs: filtered.slice(0, limit),
        total: filtered.length,
      },
    }
  }

  /**
 * API Operation
 */
  async validateCron(validateDto: ValidateCronDto) {
    this.logger.log(`Validating cron: ${validateDto.expression}`)

    // Operation
    const parts = validateDto.expression.split(' ')
    const valid = parts.length >= 5 && parts.length <= 6

    return {
      success: true,
      data: {
        expression: validateDto.expression,
        valid,
        nextRuns: valid ? this.getNextCronRuns(validateDto.expression, 5) : [],
        description: valid ? this.describeCron(validateDto.expression) : 'Invalid expression',
      },
    }
  }

  /**
 * API Operation
 */
  private calculateNextRun(job: any): string {
    const now = new Date()
    
    if (job.type === JobType.CRON && job.cronExpression) {
      // Operation
      return new Date(now.getTime() + 3600000).toISOString()
    }
    
    if (job.type === JobType.INTERVAL && job.interval) {
      return new Date(now.getTime() + job.interval).toISOString()
    }
    
    if (job.type === JobType.ONCE && job.startTime) {
      return job.startTime
    }
    
    return new Date(now.getTime() + 3600000).toISOString()
  }

  /**
 * API Operation
 */
  private getNextCronRuns(expression: string, count: number): string[] {
    const runs: string[] = []
    let time = new Date()
    
    for (let i = 0; i < count; i++) {
      time = new Date(time.getTime() + 3600000) // Operation
      runs.push(time.toISOString())
    }
    
    return runs
  }

  /**
 * API Operation
 */
  private describeCron(expression: string): string {
    return `Runs according to cron expression: ${expression}`
  }
}
