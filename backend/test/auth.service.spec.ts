import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../src/auth/auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      account: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    };
    service = new AuthService(prismaMock as any);
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

  describe('registerEmail', () => {
    it('should sign up new user and return VERIFY_EMAIL', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      // mock the internal postJson via fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      } as any);

      const result = await service.registerEmail({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'CANDIDATE',
      });

      expect(result.status).toBe('VERIFY_EMAIL');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('requestPasswordReset', () => {
    it('should return EMAIL_NOT_FOUND when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset({
        email: 'unknown@example.com',
      });

      expect(result.status).toBe('EMAIL_NOT_FOUND');
    });

    it('should return OAUTH_ONLY for oauth-only user', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'cuid123',
        emailVerified: true,
      });
      prismaMock.account.findFirst.mockResolvedValue(null);

      const result = await service.requestPasswordReset({
        email: 'oauth@example.com',
      });

      expect(result.status).toBe('OAUTH_ONLY');
    });
  });
});
