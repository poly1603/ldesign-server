import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LauncherService } from '../service/launcher.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/launcher',
})
export class LauncherGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private launcherService: LauncherService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  /**
   * 订阅项目日志
   */
  @SubscribeMessage('subscribe:logs')
  handleSubscribeLogs(
    client: Socket,
    payload: { projectId: number; command: string },
  ) {
    const { projectId, command } = payload;
    const key = `${projectId}-${command}`;
    const process = this.launcherService.getProcess(key);

    if (process) {
      // 加入特定房间
      const room = `project-${projectId}-${command}`;
      client.join(room);

      // 监听新日志
      const logHandler = (log: any) => {
        console.log('[Gateway] Emitting log to client:', log);
        client.emit('log', log);
      };

      const exitHandler = (data: any) => {
        client.emit('exit', data);
      };

      process.eventEmitter.on('log', logHandler);
      process.eventEmitter.on('exit', exitHandler);

      // 客户端断开时清理监听器
      client.on('disconnect', () => {
        process.eventEmitter.off('log', logHandler);
        process.eventEmitter.off('exit', exitHandler);
      });

      // 立即发送一条测试日志
      client.emit('log', {
        type: 'stdout',
        message: `[WebSocket] 已连接到项目 ${projectId} 的 ${command} 操作\n`,
        timestamp: new Date(),
      });

      // 发送初始状态
      client.emit('status', {
        status: process.status,
        pid: process.pid,
        startTime: process.startTime,
      });
    } else {
      client.emit('error', {
        message: 'Process not found',
      });
    }
  }

  /**
   * 取消订阅日志
   */
  @SubscribeMessage('unsubscribe:logs')
  handleUnsubscribeLogs(
    client: Socket,
    payload: { projectId: number; command: string },
  ) {
    const { projectId, command } = payload;
    const room = `project-${projectId}-${command}`;
    client.leave(room);
  }

  /**
   * 广播日志到所有订阅的客户端
   */
  broadcastLog(projectId: number, command: string, log: any) {
    const room = `project-${projectId}-${command}`;
    this.server.to(room).emit('log', log);
  }

  /**
   * 广播进程退出事件
   */
  broadcastExit(projectId: number, command: string, data: any) {
    const room = `project-${projectId}-${command}`;
    this.server.to(room).emit('exit', data);
  }
}
