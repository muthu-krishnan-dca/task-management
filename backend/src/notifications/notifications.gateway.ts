import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  timestamp: string;
  task?: any;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to real-time notifications: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from notifications: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: any): string {
    return 'pong';
  }

  broadcastNotification(payload: NotificationPayload) {
    if (this.server) {
      this.server.emit('notification', payload);
      this.server.emit(payload.type, payload);
    }
  }

  notifyTaskCreated(task: any) {
    const payload: NotificationPayload = {
      id: Date.now().toString(),
      title: 'New Task Created 📝',
      message: `Task "${task.title}" has been created in ${task.project || 'General'}.`,
      type: 'info',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      task,
    };
    this.broadcastNotification(payload);
    if (this.server) {
      this.server.emit('task_created', task);
    }
  }

  notifyTaskUpdated(task: any) {
    const isCompleted = task.status === 'Completed' || task.status === 'completed';
    const payload: NotificationPayload = {
      id: Date.now().toString(),
      title: isCompleted ? 'Task Completed 🎉' : 'Task Updated ⚡',
      message: `Task "${task.title}" is now marked as "${task.status}".`,
      type: isCompleted ? 'success' : 'warning',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      task,
    };
    this.broadcastNotification(payload);
    if (this.server) {
      this.server.emit('task_updated', task);
    }
  }

  notifyTaskDeleted(taskId: string) {
    const payload: NotificationPayload = {
      id: Date.now().toString(),
      title: 'Task Deleted 🗑️',
      message: `A task was removed from the system.`,
      type: 'danger',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.broadcastNotification(payload);
    if (this.server) {
      this.server.emit('task_deleted', { id: taskId });
    }
  }
}
