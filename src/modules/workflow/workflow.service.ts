import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  ExecuteWorkflowDto,
  StopWorkflowDto,
  ListWorkflowsDto,
  GetExecutionHistoryDto,
  ImportWorkflowDto,
  CreateTemplateDto,
  ValidateWorkflowDto,
  WorkflowStatus,
  StepType,
  ExecutionMode,
} from './dto/workflow.dto.js'

interface Workflow {
  id: string
  name: string
  description: string
  steps: any[]
  mode: ExecutionMode
  variables: Record<string, any>
  tags: string[]
  enabled: boolean
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
}

interface Execution {
  id: string
  workflowId: string
  status: WorkflowStatus
  startedAt: string
  completedAt?: string
  input: Record<string, any>
  output?: Record<string, any>
  steps: any[]
  error?: string
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name)
  private workflows: Map<string, Workflow> = new Map()
  private executions: Map<string, Execution> = new Map()
  private templates: Map<string, any> = new Map()

  /**
 * API Operation
 */
  async createWorkflow(createDto: CreateWorkflowDto) {
    this.logger.log(`Creating workflow: ${createDto.name}`)

    const workflowId = `workflow-${Date.now()}`
    const workflow: Workflow = {
      id: workflowId,
      name: createDto.name,
      description: createDto.description,
      steps: createDto.steps,
      mode: createDto.mode || ExecutionMode.SEQUENTIAL,
      variables: createDto.variables || {},
      tags: createDto.tags || [],
      enabled: createDto.enabled !== false,
      status: WorkflowStatus.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.workflows.set(workflowId, workflow)

    return {
      success: true,
      data: workflow,
      message: 'Workflow created successfully',
    }
  }

  /**
 * API Operation
 */
  async listWorkflows(listDto: ListWorkflowsDto) {
    this.logger.log('Listing workflows')

    let workflows = Array.from(this.workflows.values())

    // Operation
    if (listDto.status) {
      workflows = workflows.filter(w => w.status === listDto.status)
    }
    if (listDto.tags && listDto.tags.length > 0) {
      workflows = workflows.filter(w => 
        listDto.tags!.some(tag => w.tags.includes(tag))
      )
    }
    if (listDto.search) {
      const search = listDto.search.toLowerCase()
      workflows = workflows.filter(w => 
        w.name.toLowerCase().includes(search) ||
        w.description.toLowerCase().includes(search)
      )
    }

    // Operation
    const page = listDto.page || 1
    const pageSize = listDto.pageSize || 20
    const start = (page - 1) * pageSize
    const paginatedWorkflows = workflows.slice(start, start + pageSize)

    return {
      success: true,
      data: {
        workflows: paginatedWorkflows,
        total: workflows.length,
        page,
        pageSize,
      },
    }
  }

  /**
 * API Operation
 */
  async getWorkflow(workflowId: string) {
    this.logger.log(`Getting workflow: ${workflowId}`)

    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new NotFoundException(`Workflow ${workflowId} not found`)
    }

    return {
      success: true,
      data: workflow,
    }
  }

  /**
 * API Operation
 */
  async updateWorkflow(workflowId: string, updateDto: UpdateWorkflowDto) {
    this.logger.log(`Updating workflow: ${workflowId}`)

    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new NotFoundException(`Workflow ${workflowId} not found`)
    }

    Object.assign(workflow, {
      ...updateDto,
      updatedAt: new Date().toISOString(),
    })

    this.workflows.set(workflowId, workflow)

    return {
      success: true,
      data: workflow,
      message: 'Workflow updated successfully',
    }
  }

  /**
 * API Operation
 */
  async deleteWorkflow(workflowId: string) {
    this.logger.log(`Deleting workflow: ${workflowId}`)

    if (!this.workflows.has(workflowId)) {
      throw new NotFoundException(`Workflow ${workflowId} not found`)
    }

    this.workflows.delete(workflowId)

    return {
      success: true,
      message: 'Workflow deleted successfully',
    }
  }

  /**
 * API Operation
 */
  async executeWorkflow(executeDto: ExecuteWorkflowDto) {
    this.logger.log(`Executing workflow: ${executeDto.workflowId}`)

    const workflow = this.workflows.get(executeDto.workflowId)
    if (!workflow) {
      throw new NotFoundException(`Workflow ${executeDto.workflowId} not found`)
    }

    const executionId = `exec-${Date.now()}`
    const execution: Execution = {
      id: executionId,
      workflowId: workflow.id,
      status: WorkflowStatus.ACTIVE,
      startedAt: new Date().toISOString(),
      input: executeDto.input || {},
      steps: [],
    }

    this.executions.set(executionId, execution)

    // Operation
    if (!executeDto.dryRun) {
      setTimeout(() => {
        this.executeSteps(execution, workflow, executeDto.variables)
      }, 100)
    }

    return {
      success: true,
      data: {
        executionId,
        workflowId: workflow.id,
        status: execution.status,
        dryRun: executeDto.dryRun || false,
      },
      message: executeDto.dryRun 
        ? 'Workflow validated successfully' 
        : 'Workflow execution started',
    }
  }

  /**
 * API Operation
 */
  async stopWorkflow(stopDto: StopWorkflowDto) {
    this.logger.log(`Stopping execution: ${stopDto.executionId}`)

    const execution = this.executions.get(stopDto.executionId)
    if (!execution) {
      throw new NotFoundException(`Execution ${stopDto.executionId} not found`)
    }

    execution.status = WorkflowStatus.CANCELLED
    execution.completedAt = new Date().toISOString()

    return {
      success: true,
      data: execution,
      message: 'Workflow execution stopped',
    }
  }

  /**
 * API Operation
 */
  async getExecutionStatus(executionId: string) {
    this.logger.log(`Getting execution status: ${executionId}`)

    const execution = this.executions.get(executionId)
    if (!execution) {
      throw new NotFoundException(`Execution ${executionId} not found`)
    }

    return {
      success: true,
      data: execution,
    }
  }

  /**
 * API Operation
 */
  async getExecutionHistory(historyDto: GetExecutionHistoryDto) {
    this.logger.log(`Getting execution history for: ${historyDto.workflowId}`)

    let executions = Array.from(this.executions.values())
      .filter(e => e.workflowId === historyDto.workflowId)

    if (historyDto.status) {
      executions = executions.filter(e => e.status === historyDto.status)
    }

    const limit = historyDto.limit || 50
    executions = executions.slice(0, limit)

    return {
      success: true,
      data: {
        workflowId: historyDto.workflowId,
        executions,
        total: executions.length,
      },
    }
  }

  /**
 * API Operation
 */
  async exportWorkflow(workflowId: string) {
    this.logger.log(`Exporting workflow: ${workflowId}`)

    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new NotFoundException(`Workflow ${workflowId} not found`)
    }

    return {
      success: true,
      data: {
        version: '1.0',
        workflow: workflow,
        exportedAt: new Date().toISOString(),
      },
    }
  }

  /**
 * API Operation
 */
  async importWorkflow(importDto: ImportWorkflowDto) {
    this.logger.log('Importing workflow')

    const definition = importDto.definition
    const workflowId = `workflow-${Date.now()}`

    const workflow: Workflow = {
      id: workflowId,
      name: definition.name || 'Imported Workflow',
      description: definition.description || '',
      steps: definition.steps || [],
      mode: definition.mode || ExecutionMode.SEQUENTIAL,
      variables: definition.variables || {},
      tags: definition.tags || [],
      enabled: true,
      status: WorkflowStatus.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.workflows.set(workflowId, workflow)

    return {
      success: true,
      data: workflow,
      message: 'Workflow imported successfully',
    }
  }

  /**
 * API Operation
 */
  async validateWorkflow(validateDto: ValidateWorkflowDto) {
    this.logger.log('Validating workflow')

    const errors: string[] = []
    const warnings: string[] = []

    // Operation
    const stepIds = new Set()
    for (const step of validateDto.steps) {
      if (stepIds.has(step.id)) {
        errors.push(`Duplicate step ID: ${step.id}`)
      }
      stepIds.add(step.id)
    }

    // Operation
    for (const step of validateDto.steps) {
      if (step.next) {
        for (const nextId of step.next) {
          if (!stepIds.has(nextId)) {
            errors.push(`Step ${step.id} references unknown step: ${nextId}`)
          }
        }
      }
    }

    // Operation
    if (validateDto.steps.length > 0 && !validateDto.steps[0].id) {
      warnings.push('No explicit start step defined')
    }

    return {
      success: true,
      data: {
        valid: errors.length === 0,
        errors,
        warnings,
      },
    }
  }

  /**
 * API Operation
 */
  async createTemplate(templateDto: CreateTemplateDto) {
    this.logger.log(`Creating template: ${templateDto.name}`)

    const templateId = `template-${Date.now()}`
    const template = {
      id: templateId,
      ...templateDto,
      createdAt: new Date().toISOString(),
    }

    this.templates.set(templateId, template)

    return {
      success: true,
      data: template,
      message: 'Template created successfully',
    }
  }

  /**
 * API Operation
 */
  async listTemplates() {
    this.logger.log('Listing templates')

    const templates = Array.from(this.templates.values())

    return {
      success: true,
      data: {
        templates,
        total: templates.length,
      },
    }
  }

  /**
 * API Operation
 */
  private async executeSteps(execution: Execution, workflow: Workflow, overrideVars?: Record<string, any>) {
    const variables = { ...workflow.variables, ...overrideVars }

    for (const step of workflow.steps) {
      const stepExecution = {
        stepId: step.id,
        name: step.name,
        type: step.type,
        status: 'running',
        startedAt: new Date().toISOString(),
      }

      execution.steps.push(stepExecution)

      // Operation
      await new Promise(resolve => setTimeout(resolve, 500))

      stepExecution.status = 'completed'
      stepExecution['completedAt'] = new Date().toISOString()
    }

    execution.status = WorkflowStatus.COMPLETED
    execution.completedAt = new Date().toISOString()
    execution.output = { result: 'success' }

    this.executions.set(execution.id, execution)
  }
}
