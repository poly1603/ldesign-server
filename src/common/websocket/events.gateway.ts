import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Logger } from '@nestjs/common'

/**
 * WebSocket 网关
 * 提供实时通信功能
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(EventsGateway.name)
  private connectedClients: Map<string, Socket> = new Map()

  /**
   * 网关初始化
   */
  afterInit() {
    this.logger.log('WebSocket Gateway initialized')
  }

  /**
   * 客户端连接时触发
   */
  handleConnection(client: Socket) {
    this.connectedClients.set(client.id, client)
    this.logger.log(`Client connected: ${client.id}`)
    
    // 向客户端发送连接成功消息
    client.emit('connection', {
      message: 'Connected to LDesign Server',
      clientId: client.id,
    })
  }

  /**
   * 客户端断开连接时触发
   */
  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id)
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  /**
   * 订阅消息：ping
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: Date.now() } }
  }

  /**
   * 订阅消息：加入房间
   */
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.room)
    this.logger.log(`Client ${client.id} joined room: ${data.room}`)
    
    // 主动发送 joinedRoom 事件给客户端
    client.emit('joinedRoom', { 
      event: 'joinedRoom', 
      data: { room: data.room },
      room: data.room 
    })
    
    return { event: 'joinedRoom', data: { room: data.room } }
  }

  /**
   * 订阅消息：离开房间
   */
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.room)
    this.logger.log(`Client ${client.id} left room: ${data.room}`)
    return { event: 'leftRoom', data: { room: data.room } }
  }

  /**
   * 向所有客户端发送消息
   */
  broadcast(event: string, data: any) {
    if (!this.server) {
      this.logger.warn(`Cannot broadcast event ${event}: WebSocket server not initialized`)
      return
    }
    this.server.emit(event, data)
  }

  /**
   * 向特定房间发送消息
   */
  broadcastToRoom(room: string, event: string, data: any) {
    // 安全检查：确保 server 和 sockets 都已初始化
    if (!this.server || !this.server.sockets || !this.server.sockets.adapter) {
      // 如果 WebSocket 服务器未初始化，静默失败（不记录警告，避免日志噪音）
      // 前端会通过轮询机制获取日志，所以这不是致命问题
      return
    }

    try {
      const clientsCount = this.server.sockets.adapter.rooms.get(room)?.size || 0
      // 只在有客户端连接时记录日志（减少日志噪音）
      if (clientsCount > 0) {
        this.logger.debug(`[Broadcast] Broadcasting to room: ${room}, event: ${event}, clients: ${clientsCount}`)
      }
      this.server.to(room).emit(event, data)
    } catch (error: any) {
      this.logger.error(`[Broadcast] Failed to broadcast to room ${room}, event ${event}: ${error.message}`)
    }
  }

  /**
   * 向特定客户端发送消息
   */
  sendToClient(clientId: string, event: string, data: any) {
    const client = this.connectedClients.get(clientId)
    if (client) {
      client.emit(event, data)
    }
  }

  /**
   * 获取已连接的客户端数量
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size
  }
}
