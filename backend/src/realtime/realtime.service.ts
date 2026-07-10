import { Injectable } from '@nestjs/common';
import type { Namespace, Server } from 'socket.io';
import { PinoLoggerService } from '../common/logger/pino-logger.service';
import type {
  DashboardInvalidateScope,
  RealtimeApplicationMessage,
  RealtimeNotification,
} from './realtime.types';

@Injectable()
export class RealtimeService {
  private server?: Server | Namespace;

  constructor(private readonly logger: PinoLoggerService) {}

  bindServer(server: Server | Namespace) {
    this.server = server;
  }

  emitApplicationMessage(applicationId: string, message: RealtimeApplicationMessage) {
    this.emitToRoom(`application:${applicationId}`, 'application.message.created', {
      applicationId,
      message,
    });
  }

  emitApplicationMessagesRead(applicationId: string, payload: { readerId: string; readAt: Date | string }) {
    this.emitToRoom(`application:${applicationId}`, 'application.messages.read', {
      applicationId,
      ...payload,
    });
  }

  emitNotificationCreated(userId: string, notification: RealtimeNotification) {
    this.emitToUser(userId, 'notification.created', { notification });
  }

  emitNotificationRead(userId: string, payload: { id: string; readAt: Date | string | null }) {
    this.emitToUser(userId, 'notification.read', payload);
  }

  emitAllNotificationsRead(userId: string, payload: { readAt: Date | string }) {
    this.emitToUser(userId, 'notification.all_read', payload);
  }

  emitUnreadCountChanged(userId: string, count: number) {
    this.emitToUser(userId, 'notification.unread_count.changed', { count });
  }

  emitDashboardInvalidate(userId: string, scope: DashboardInvalidateScope, reason: string) {
    this.emitToUser(userId, 'dashboard.invalidate', { scope, reason });
  }

  private emitToUser(userId: string, event: string, payload: unknown) {
    this.emitToRoom(`user:${userId}`, event, payload);
  }

  private emitToRoom(room: string, event: string, payload: unknown) {
    if (!this.server) {
      this.logger.debug(`Realtime server not ready for ${event}`, 'RealtimeService');
      return;
    }
    this.server.to(room).emit(event, payload);
  }
}
