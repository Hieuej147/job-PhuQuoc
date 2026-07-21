import { Injectable } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import type { DashboardInvalidateScope, RealtimeNotification } from './realtime.types';

@Injectable()
export class RealtimeSseService {
  private readonly userStreams = new Map<string, Set<Subject<MessageEvent>>>();

  streamUserEvents(userId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const subject = new Subject<MessageEvent>();
      const streams = this.userStreams.get(userId) ?? new Set<Subject<MessageEvent>>();
      streams.add(subject);
      this.userStreams.set(userId, streams);

      const subscription = subject.subscribe(subscriber);
      subscriber.next({ type: 'realtime.ready', data: { ok: true } });

      const heartbeat = setInterval(() => {
        subscriber.next({ type: 'heartbeat', data: { ts: Date.now() } });
      }, 25_000);

      return () => {
        clearInterval(heartbeat);
        subscription.unsubscribe();
        streams.delete(subject);
        if (streams.size === 0) {
          this.userStreams.delete(userId);
        }
      };
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
    const streams = this.userStreams.get(userId);
    if (!streams?.size) return;
    const data = typeof payload === 'object' && payload !== null ? payload : { value: payload };
    for (const stream of streams) {
      stream.next({ type: event, data });
    }
  }
}
