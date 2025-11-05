import { Injectable, Logger } from '@nestjs/common'
import { EventsGateway } from '../events.gateway.js'
import {
  WebSocketEvent,
  WebSocketEventType,
  RoomType,
  BuildEventData,
  TestEventData,
  DeployEventData,
  WorkflowEventData,
  JobEventData,
  FileEventData,
  MonitorEventData,
  LogEventData,
  SystemEventData,
  IntegrationEventData,
} from '../types/websocket-events.types.js'

/**
 * API Operation
 */
@Injectable()
export class WebSocketEventsService {
  private readonly logger = new Logger(WebSocketEventsService.name)

  constructor(private readonly eventsGateway: EventsGateway) {}

  /**
 * API Operation
 */
  private broadcast<T>(type: WebSocketEventType, data: T, room?: string) {
    const event: WebSocketEvent<T> = {
      type,
      data,
      timestamp: Date.now(),
      room,
    }

    if (room) {
      this.eventsGateway.broadcastToRoom(room, 'event', event)
      this.logger.debug(`Event ${type} sent to room ${room}`)
    } else {
      this.eventsGateway.broadcast('event', event)
      this.logger.debug(`Event ${type} broadcast to all clients`)
    }
  }

  /**
 * API Operation
 */
  private getRoom(type: RoomType, id?: string): string {
    return id ? `${type}:${id}` : type
  }

  // Operation

  sendBuildStart(data: BuildEventData) {
    const room = this.getRoom(RoomType.BUILD, data.buildId)
    this.broadcast(WebSocketEventType.BUILD_START, data, room)
  }

  sendBuildProgress(data: BuildEventData) {
    const room = this.getRoom(RoomType.BUILD, data.buildId)
    this.broadcast(WebSocketEventType.BUILD_PROGRESS, data, room)
  }

  sendBuildComplete(data: BuildEventData) {
    const room = this.getRoom(RoomType.BUILD, data.buildId)
    this.broadcast(WebSocketEventType.BUILD_COMPLETE, data, room)
  }

  sendBuildError(data: BuildEventData) {
    const room = this.getRoom(RoomType.BUILD, data.buildId)
    this.broadcast(WebSocketEventType.BUILD_ERROR, data, room)
  }

  // Operation

  sendTestStart(data: TestEventData) {
    const room = this.getRoom(RoomType.TEST, data.testId)
    this.broadcast(WebSocketEventType.TEST_START, data, room)
  }

  sendTestProgress(data: TestEventData) {
    const room = this.getRoom(RoomType.TEST, data.testId)
    this.broadcast(WebSocketEventType.TEST_PROGRESS, data, room)
  }

  sendTestComplete(data: TestEventData) {
    const room = this.getRoom(RoomType.TEST, data.testId)
    this.broadcast(WebSocketEventType.TEST_COMPLETE, data, room)
  }

  sendTestError(data: TestEventData) {
    const room = this.getRoom(RoomType.TEST, data.testId)
    this.broadcast(WebSocketEventType.TEST_ERROR, data, room)
  }

  // Operation

  sendDeployStart(data: DeployEventData) {
    const room = this.getRoom(RoomType.DEPLOY, data.deployId)
    this.broadcast(WebSocketEventType.DEPLOY_START, data, room)
  }

  sendDeployProgress(data: DeployEventData) {
    const room = this.getRoom(RoomType.DEPLOY, data.deployId)
    this.broadcast(WebSocketEventType.DEPLOY_PROGRESS, data, room)
  }

  sendDeployComplete(data: DeployEventData) {
    const room = this.getRoom(RoomType.DEPLOY, data.deployId)
    this.broadcast(WebSocketEventType.DEPLOY_COMPLETE, data, room)
  }

  sendDeployError(data: DeployEventData) {
    const room = this.getRoom(RoomType.DEPLOY, data.deployId)
    this.broadcast(WebSocketEventType.DEPLOY_ERROR, data, room)
  }

  // Operation

  sendWorkflowStart(data: WorkflowEventData) {
    const room = this.getRoom(RoomType.WORKFLOW, data.executionId)
    this.broadcast(WebSocketEventType.WORKFLOW_START, data, room)
  }

  sendWorkflowStep(data: WorkflowEventData) {
    const room = this.getRoom(RoomType.WORKFLOW, data.executionId)
    this.broadcast(WebSocketEventType.WORKFLOW_STEP, data, room)
  }

  sendWorkflowComplete(data: WorkflowEventData) {
    const room = this.getRoom(RoomType.WORKFLOW, data.executionId)
    this.broadcast(WebSocketEventType.WORKFLOW_COMPLETE, data, room)
  }

  sendWorkflowError(data: WorkflowEventData) {
    const room = this.getRoom(RoomType.WORKFLOW, data.executionId)
    this.broadcast(WebSocketEventType.WORKFLOW_ERROR, data, room)
  }

  // Operation

  sendJobScheduled(data: JobEventData) {
    const room = this.getRoom(RoomType.JOB, data.jobId)
    this.broadcast(WebSocketEventType.JOB_SCHEDULED, data, room)
  }

  sendJobStart(data: JobEventData) {
    const room = this.getRoom(RoomType.JOB, data.jobId)
    this.broadcast(WebSocketEventType.JOB_START, data, room)
  }

  sendJobComplete(data: JobEventData) {
    const room = this.getRoom(RoomType.JOB, data.jobId)
    this.broadcast(WebSocketEventType.JOB_COMPLETE, data, room)
  }

  sendJobError(data: JobEventData) {
    const room = this.getRoom(RoomType.JOB, data.jobId)
    this.broadcast(WebSocketEventType.JOB_ERROR, data, room)
  }

  // Operation

  sendFileUpload(data: FileEventData) {
    this.broadcast(WebSocketEventType.FILE_UPLOAD, data)
  }

  sendFileDownload(data: FileEventData) {
    this.broadcast(WebSocketEventType.FILE_DOWNLOAD, data)
  }

  sendFileCompress(data: FileEventData) {
    this.broadcast(WebSocketEventType.FILE_COMPRESS, data)
  }

  sendFileExtract(data: FileEventData) {
    this.broadcast(WebSocketEventType.FILE_EXTRACT, data)
  }

  sendFileOperationComplete(data: FileEventData) {
    this.broadcast(WebSocketEventType.FILE_OPERATION_COMPLETE, data)
  }

  // Operation

  sendNotificationSent(data: any) {
    this.broadcast(WebSocketEventType.NOTIFICATION_SENT, data)
  }

  sendNotificationError(data: any) {
    this.broadcast(WebSocketEventType.NOTIFICATION_ERROR, data)
  }

  // Operation

  sendMonitorAlert(data: MonitorEventData) {
    const room = this.getRoom(RoomType.MONITOR)
    this.broadcast(WebSocketEventType.MONITOR_ALERT, data, room)
  }

  sendMonitorMetric(data: MonitorEventData) {
    const room = this.getRoom(RoomType.MONITOR)
    this.broadcast(WebSocketEventType.MONITOR_METRIC, data, room)
  }

  // Operation

  sendPerformanceReport(data: any) {
    this.broadcast(WebSocketEventType.PERFORMANCE_REPORT, data)
  }

  // Operation

  sendGitCommit(data: any) {
    this.broadcast(WebSocketEventType.GIT_COMMIT, data)
  }

  sendGitPush(data: any) {
    this.broadcast(WebSocketEventType.GIT_PUSH, data)
  }

  sendGitPull(data: any) {
    this.broadcast(WebSocketEventType.GIT_PULL, data)
  }

  // Operation

  sendProjectCreated(data: any) {
    const room = this.getRoom(RoomType.PROJECT)
    this.broadcast(WebSocketEventType.PROJECT_CREATED, data, room)
  }

  sendProjectUpdated(data: any) {
    const room = this.getRoom(RoomType.PROJECT)
    this.broadcast(WebSocketEventType.PROJECT_UPDATED, data, room)
  }

  sendProjectDeleted(data: any) {
    const room = this.getRoom(RoomType.PROJECT)
    this.broadcast(WebSocketEventType.PROJECT_DELETED, data, room)
  }

  // Operation

  sendLogEntry(data: LogEventData) {
    this.broadcast(WebSocketEventType.LOG_ENTRY, data)
  }

  sendLogError(data: LogEventData) {
    this.broadcast(WebSocketEventType.LOG_ERROR, data)
  }

  // Operation

  sendSystemAlert(data: SystemEventData) {
    const room = this.getRoom(RoomType.SYSTEM)
    this.broadcast(WebSocketEventType.SYSTEM_ALERT, data, room)
  }

  sendSystemMetric(data: SystemEventData) {
    const room = this.getRoom(RoomType.SYSTEM)
    this.broadcast(WebSocketEventType.SYSTEM_METRIC, data, room)
  }

  // Operation

  sendIntegrationGitHub(data: IntegrationEventData) {
    this.broadcast(WebSocketEventType.INTEGRATION_GITHUB, data)
  }

  sendIntegrationGitLab(data: IntegrationEventData) {
    this.broadcast(WebSocketEventType.INTEGRATION_GITLAB, data)
  }

  sendIntegrationDocker(data: IntegrationEventData) {
    this.broadcast(WebSocketEventType.INTEGRATION_DOCKER, data)
  }

  sendIntegrationJenkins(data: IntegrationEventData) {
    this.broadcast(WebSocketEventType.INTEGRATION_JENKINS, data)
  }

  // Operation

  /**
 * API Operation
 */
  getConnectedClientsCount(): number {
    return this.eventsGateway.getConnectedClientsCount()
  }

  /**
 * API Operation
 */
  sendToClient<T>(clientId: string, type: WebSocketEventType, data: T) {
    const event: WebSocketEvent<T> = {
      type,
      data,
      timestamp: Date.now(),
      clientId,
    }
    this.eventsGateway.sendToClient(clientId, 'event', event)
  }

  /**
 * API Operation
 */
  sendEvent<T>(type: WebSocketEventType, data: T, room?: string) {
    this.broadcast(type, data, room)
  }
}
