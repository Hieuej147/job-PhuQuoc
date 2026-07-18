import { Injectable } from '@nestjs/common';
import type {
  DashboardInvalidateScope,
  RealtimeApplicationMessage,
  RealtimeNotification,
} from './realtime.types';
import { RealtimeSocketService } from './realtime-socket.service';
import { RealtimeSseService } from './realtime-sse.service';

@Injectable()
export class RealtimeService {
  constructor(
    private readonly socket: RealtimeSocketService,
    private readonly sse: RealtimeSseService,
  ) {}

  emitApplicationMessage(applicationId: string, message: RealtimeApplicationMessage) {
    this.socket.emitApplicationMessage(applicationId, message);
  }

  emitApplicationMessagesRead(applicationId: string, payload: { readerId: string; readAt: Date | string }) {
    this.socket.emitApplicationMessagesRead(applicationId, payload);
  }

  emitNotificationCreated(userId: string, notification: RealtimeNotification) {
    this.sse.emitNotificationCreated(userId, notification);
  }

  emitNotificationRead(userId: string, payload: { id: string; readAt: Date | string | null }) {
    this.sse.emitNotificationRead(userId, payload);
  }

  emitAllNotificationsRead(userId: string, payload: { readAt: Date | string }) {
    this.sse.emitAllNotificationsRead(userId, payload);
  }

  emitUnreadCountChanged(userId: string, count: number) {
    this.sse.emitUnreadCountChanged(userId, count);
  }

  emitDashboardInvalidate(userId: string, scope: DashboardInvalidateScope, reason: string) {
    this.sse.emitDashboardInvalidate(userId, scope, reason);
  }
}
