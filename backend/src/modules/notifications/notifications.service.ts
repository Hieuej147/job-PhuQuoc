import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, NotificationType } from '@prisma/client';
import { NotificationQueryDto } from './dto/notification.dto';
import { RealtimeService } from '../../realtime/realtime.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime?: RealtimeService,
  ) {}

  async findByUser(userId: string, query: NotificationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 50);
    const { isRead } = query;
    const where: Prisma.NotificationWhereInput = { userId };
    if (isRead !== undefined) where.isRead = isRead;
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notification not found');
    const updated = await this.prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
    const unread = await this.prisma.notification.count({ where: { userId, isRead: false } });
    this.realtime?.emitNotificationRead(userId, { id, readAt: updated.readAt });
    this.realtime?.emitUnreadCountChanged(userId, unread);
    this.realtime?.emitDashboardInvalidate(userId, 'candidate', 'notification-read');
    this.realtime?.emitDashboardInvalidate(userId, 'employer', 'notification-read');
    return updated;
  }

  async markAllAsRead(userId: string) {
    const readAt = new Date();
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt },
    });
    this.realtime?.emitAllNotificationsRead(userId, { readAt });
    this.realtime?.emitUnreadCountChanged(userId, 0);
    this.realtime?.emitDashboardInvalidate(userId, 'candidate', 'notifications-read-all');
    this.realtime?.emitDashboardInvalidate(userId, 'employer', 'notifications-read-all');
    return { message: 'All notifications marked as read' };
  }

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    content: string;
    refId?: string | null;
    refType?: string | null;
    expiresAt?: Date | null;
    dedupeKey?: string | null;
  }) {
    const notification = await this.prisma.notification.create({ data });
    const unread = await this.prisma.notification.count({ where: { userId: data.userId, isRead: false } });
    this.realtime?.emitNotificationCreated(data.userId, notification);
    this.realtime?.emitUnreadCountChanged(data.userId, unread);
    this.realtime?.emitDashboardInvalidate(data.userId, 'candidate', 'notification-created');
    this.realtime?.emitDashboardInvalidate(data.userId, 'employer', 'notification-created');
    return notification;
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { count };
  }
}
