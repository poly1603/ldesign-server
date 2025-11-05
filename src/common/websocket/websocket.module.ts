import { Module, Global } from '@nestjs/common'
import { EventsGateway } from './events.gateway.js'
import { WebSocketEventsService } from './services/websocket-events.service.js'

/**
 * WebSocket 模块
 * 提供全局 WebSocket 功能
 */
@Global()
@Module({
  providers: [EventsGateway, WebSocketEventsService],
  exports: [EventsGateway, WebSocketEventsService],
})
export class WebSocketModule {}










