/**
 * WebSocket 事件类型定义
 */

// 事件类型枚举
export enum WebSocketEventType {
  // 构建事件
  BUILD_START = 'build:start',
  BUILD_PROGRESS = 'build:progress',
  BUILD_COMPLETE = 'build:complete',
  BUILD_ERROR = 'build:error',
  
  // 测试事件
  TEST_START = 'test:start',
  TEST_PROGRESS = 'test:progress',
  TEST_COMPLETE = 'test:complete',
  TEST_ERROR = 'test:error',
  
  // 部署事件
  DEPLOY_START = 'deploy:start',
  DEPLOY_PROGRESS = 'deploy:progress',
  DEPLOY_COMPLETE = 'deploy:complete',
  DEPLOY_ERROR = 'deploy:error',
  
  // 工作流事件
  WORKFLOW_START = 'workflow:start',
  WORKFLOW_STEP = 'workflow:step',
  WORKFLOW_COMPLETE = 'workflow:complete',
  WORKFLOW_ERROR = 'workflow:error',
  
  // 调度任务事件
  JOB_SCHEDULED = 'job:scheduled',
  JOB_START = 'job:start',
  JOB_COMPLETE = 'job:complete',
  JOB_ERROR = 'job:error',
  
  // 文件操作事件
  FILE_UPLOAD = 'file:upload',
  FILE_DOWNLOAD = 'file:download',
  FILE_COMPRESS = 'file:compress',
  FILE_EXTRACT = 'file:extract',
  FILE_OPERATION_COMPLETE = 'file:complete',
  
  // 通知事件
  NOTIFICATION_SENT = 'notification:sent',
  NOTIFICATION_ERROR = 'notification:error',
  
  // 监控事件
  MONITOR_ALERT = 'monitor:alert',
  MONITOR_METRIC = 'monitor:metric',
  
  // 性能事件
  PERFORMANCE_REPORT = 'performance:report',
  
  // Git事件
  GIT_COMMIT = 'git:commit',
  GIT_PUSH = 'git:push',
  GIT_PULL = 'git:pull',
  
  // 项目事件
  PROJECT_CREATED = 'project:created',
  PROJECT_UPDATED = 'project:updated',
  PROJECT_DELETED = 'project:deleted',
  
  // 日志事件
  LOG_ENTRY = 'log:entry',
  LOG_ERROR = 'log:error',
  
  // 系统事件
  SYSTEM_ALERT = 'system:alert',
  SYSTEM_METRIC = 'system:metric',
  
  // Integration事件
  INTEGRATION_GITHUB = 'integration:github',
  INTEGRATION_GITLAB = 'integration:gitlab',
  INTEGRATION_DOCKER = 'integration:docker',
  INTEGRATION_JENKINS = 'integration:jenkins',
  
  // Verdaccio 事件
  VERDACCIO_RESTART_START = 'verdaccio:restart:start',
  VERDACCIO_RESTART_STOPPING = 'verdaccio:restart:stopping',
  VERDACCIO_RESTART_STARTING = 'verdaccio:restart:starting',
  VERDACCIO_RESTART_COMPLETE = 'verdaccio:restart:complete',
  VERDACCIO_RESTART_ERROR = 'verdaccio:restart:error',
  VERDACCIO_CONFIG_SAVED = 'verdaccio:config:saved',
  
  // Node 管理器安装事件
  NODE_MANAGER_INSTALL_START = 'node:manager:install:start',
  NODE_MANAGER_INSTALL_PROGRESS = 'node:manager:install:progress',
  NODE_MANAGER_INSTALL_LOG = 'node:manager:install:log',
  NODE_MANAGER_INSTALL_COMPLETE = 'node:manager:install:complete',
  NODE_MANAGER_INSTALL_ERROR = 'node:manager:install:error',
}

// 房间类型
export enum RoomType {
  PROJECT = 'project',
  BUILD = 'build',
  TEST = 'test',
  DEPLOY = 'deploy',
  WORKFLOW = 'workflow',
  JOB = 'job',
  MONITOR = 'monitor',
  SYSTEM = 'system',
  VERDACCIO = 'verdaccio',
  NODE = 'node',
  GLOBAL = 'global',
}

// 事件数据接口
export interface WebSocketEvent<T = any> {
  type: WebSocketEventType
  data: T
  timestamp: number
  room?: string
  clientId?: string
}

// 构建事件数据
export interface BuildEventData {
  projectId: string
  buildId: string
  status: 'started' | 'building' | 'completed' | 'failed'
  progress?: number
  message?: string
  error?: string
  duration?: number
  output?: string
}

// 测试事件数据
export interface TestEventData {
  projectId: string
  testId: string
  status: 'started' | 'running' | 'completed' | 'failed'
  progress?: number
  passed?: number
  failed?: number
  total?: number
  coverage?: number
  message?: string
  error?: string
}

// 部署事件数据
export interface DeployEventData {
  projectId: string
  deployId: string
  environment: string
  status: 'started' | 'deploying' | 'completed' | 'failed'
  progress?: number
  message?: string
  error?: string
  url?: string
}

// 工作流事件数据
export interface WorkflowEventData {
  workflowId: string
  executionId: string
  step?: string
  stepIndex?: number
  totalSteps?: number
  status: 'started' | 'running' | 'completed' | 'failed'
  progress?: number
  message?: string
  error?: string
  output?: any
}

// 任务事件数据
export interface JobEventData {
  jobId: string
  executionId: string
  name: string
  status: 'scheduled' | 'started' | 'completed' | 'failed'
  scheduledTime?: Date
  startTime?: Date
  endTime?: Date
  message?: string
  error?: string
  output?: any
}

// 文件操作事件数据
export interface FileEventData {
  operation: 'upload' | 'download' | 'compress' | 'extract' | 'copy' | 'move' | 'delete'
  path: string
  size?: number
  progress?: number
  status: 'started' | 'processing' | 'completed' | 'failed'
  message?: string
  error?: string
}

// 监控事件数据
export interface MonitorEventData {
  type: 'alert' | 'metric'
  name: string
  value?: number
  threshold?: number
  status: 'ok' | 'warning' | 'critical'
  message: string
  timestamp: number
}

// 日志事件数据
export interface LogEventData {
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: string
  timestamp: number
  meta?: any
}

// 系统事件数据
export interface SystemEventData {
  type: 'alert' | 'metric' | 'status'
  component: string
  message: string
  data?: any
  timestamp: number
}

// Integration事件数据
export interface IntegrationEventData {
  platform: 'github' | 'gitlab' | 'docker' | 'jenkins'
  action: string
  status: 'started' | 'completed' | 'failed'
  message?: string
  error?: string
  data?: any
}

// Verdaccio 事件数据
export interface VerdaccioEventData {
  registryId?: string
  port?: number
  status: 'stopping' | 'stopped' | 'starting' | 'started' | 'completed' | 'failed'
  message?: string
  error?: string
  progress?: number
  logs?: string[]
  url?: string
}

export interface NodeManagerInstallLog {
  type: 'stdout' | 'stderr' | 'info' | 'error'
  content: string
}

export interface NodeManagerInstallEventData {
  taskId: string
  managerType: string
  managerName: string
  status: 'running' | 'completed' | 'failed'
  progress?: number
  message?: string
  error?: string
  log?: NodeManagerInstallLog
}
