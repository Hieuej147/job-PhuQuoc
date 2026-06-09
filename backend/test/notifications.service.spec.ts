import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      notification: {
        findMany: vi.fn(),
        count: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        create: vi.fn(),
      },
    };
    service = new NotificationsService(prismaMock as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByUser', () => {
    it('should return paginated notifications for user', async () => {
      const mockNotifications = [
        { id: '1', title: 'Notification 1', isRead: false },
        { id: '2', title: 'Notification 2', isRead: true },
      ];
      prismaMock.notification.findMany.mockResolvedValue(mockNotifications);
      prismaMock.notification.count.mockResolvedValue(2);

      const result = await service.findByUser('user1', { page: 1, limit: 20 });

      expect(result.items).toEqual(mockNotifications);
      expect(result.total).toBe(2);
    });

    it('should filter by isRead', async () => {
      prismaMock.notification.findMany.mockResolvedValue([]);
      prismaMock.notification.count.mockResolvedValue(0);

      await service.findByUser('user1', { isRead: false });

      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isRead: false }),
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read when found and owned by user', async () => {
      const mockNotification = { id: '1', userId: 'user1', isRead: false };
      prismaMock.notification.findFirst.mockResolvedValue(mockNotification);
      prismaMock.notification.update.mockResolvedValue({ ...mockNotification, isRead: true });

      const result = await service.markAsRead('1', 'user1');
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException when notification not found', async () => {
      prismaMock.notification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('nonexistent', 'user1')).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      prismaMock.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user1');
      expect(result.message).toBe('All notifications marked as read');
    });
  });

  describe('create', () => {
    it('should create notification', async () => {
      const mockNotification = {
        id: '1',
        userId: 'user1',
        type: 'APPLICATION_RECEIVED' as any,
        title: 'New Application',
        content: 'You have a new application',
      };
      prismaMock.notification.create.mockResolvedValue(mockNotification);

      const result = await service.create(mockNotification);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      prismaMock.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user1');
      expect(result.count).toBe(5);
    });
  });
});
