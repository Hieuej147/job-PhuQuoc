import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { RealtimeService } from '../../realtime/realtime.service';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface NotificationInboxInput {
  userId?: string | null;
  type: NotificationType;
  title: string;
  content: string;
  dedupeKey: string;
  refId?: string | null;
  refType?: string | null;
  expiresInDays?: number;
}

export async function createNotificationInboxItem(
  prisma: PrismaService,
  input: NotificationInboxInput,
  realtime?: RealtimeService,
) {
  if (!input.userId) return null;

  const expiresInDays = input.expiresInDays ?? 90;
  const expiresAt = new Date(Date.now() + expiresInDays * DAY_MS);

  const notification = await prisma.notification.upsert({
    where: {
      userId_dedupeKey: {
        userId: input.userId,
        dedupeKey: input.dedupeKey,
      },
    },
    update: {},
    create: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      content: input.content,
      refId: input.refId,
      refType: input.refType,
      dedupeKey: input.dedupeKey,
      expiresAt,
    },
  });
  if (realtime) {
    const unread = await prisma.notification.count({ where: { userId: input.userId, isRead: false } });
    realtime.emitNotificationCreated(input.userId, notification);
    realtime.emitUnreadCountChanged(input.userId, unread);
    realtime.emitDashboardInvalidate(input.userId, 'candidate', 'notification-created');
    realtime.emitDashboardInvalidate(input.userId, 'employer', 'notification-created');
  }
  return notification;
}
