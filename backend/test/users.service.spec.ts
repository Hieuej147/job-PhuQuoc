import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersService } from '../src/modules/users/users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: any;
  let auditServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };
    auditServiceMock = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    service = new UsersService(prismaMock as any, auditServiceMock as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const mockUsers = [
        { id: '1', name: 'User 1', email: 'user1@test.com', role: 'CANDIDATE' },
        { id: '2', name: 'User 2', email: 'user2@test.com', role: 'EMPLOYER' },
      ];
      prismaMock.user.findMany.mockResolvedValue(mockUsers);
      prismaMock.user.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toEqual(mockUsers);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by role', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      await service.findAll({ role: 'ADMIN' });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: 'ADMIN' },
        }),
      );
    });

    it('should filter by search', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      await service.findAll({ search: 'test' });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { email: { contains: 'test', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should convert page and limit to numbers', async () => {
      prismaMock.user.findMany.mockResolvedValue([]);
      prismaMock.user.count.mockResolvedValue(0);

      await service.findAll({ page: '2' as any, limit: '5' as any });

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '1', name: 'User 1', email: 'user1@test.com' };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('update', () => {
    it('should update user and fire audit event', async () => {
      const mockUser = { id: '1', name: 'User 1', phone: null, image: null };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, name: 'Updated' });

      const result = await service.update('1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(auditServiceMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.updated' }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow('User not found');
    });
  });

  describe('toggleActive', () => {
    it('should toggle user active status and fire audit event', async () => {
      const mockUser = { id: '1', isActive: true };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, isActive: false });

      const result = await service.toggleActive('1');
      expect(result.isActive).toBe(false);
      expect(auditServiceMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.active.toggled' }),
      );
    });
  });

  describe('toggleLock', () => {
    it('should toggle user lock status and fire audit event', async () => {
      const mockUser = { id: '1', isLocked: false };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, isLocked: true });

      const result = await service.toggleLock('1');
      expect(result.isLocked).toBe(true);
      expect(auditServiceMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.locked.toggled' }),
      );
    });
  });

  describe('remove', () => {
    it('should delete user and fire audit event', async () => {
      const mockUser = { id: '1', name: 'User 1', email: 'user1@test.com', role: 'CANDIDATE' };
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove('1');
      expect(result.message).toBe('User deleted');
      expect(auditServiceMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'user.deleted' }),
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow('User not found');
    });
  });
});
