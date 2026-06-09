import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomAuthService } from '../src/auth/auth.service';

describe('CustomAuthService', () => {
  let service: CustomAuthService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    service = new CustomAuthService(prismaMock as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile when found', async () => {
      const mockUser = {
        id: 'cuid123',
        name: 'Test User',
        email: 'test@example.com',
        emailVerified: true,
        image: null,
        role: 'CANDIDATE',
        phone: null,
        isActive: true,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('cuid123');
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'cuid123' },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
          role: true,
        }),
      });
    });

    it('should return null when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.getProfile('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updatedUser = {
        id: 'cuid123',
        name: 'Updated Name',
        email: 'test@example.com',
        image: null,
        role: 'CANDIDATE',
        phone: '0123456789',
      };

      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('cuid123', {
        name: 'Updated Name',
        phone: '0123456789',
      });

      expect(result).toEqual(updatedUser);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'cuid123' },
        data: { name: 'Updated Name', phone: '0123456789' },
        select: expect.objectContaining({
          id: true,
          name: true,
          email: true,
          role: true,
        }),
      });
    });
  });
});
