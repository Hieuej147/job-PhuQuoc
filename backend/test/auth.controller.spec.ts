import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomAuthController } from '../src/auth/auth.controller';

describe('CustomAuthController', () => {
  let controller: CustomAuthController;
  let authServiceMock: any;

  beforeEach(() => {
    authServiceMock = {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
    };
    controller = new CustomAuthController(authServiceMock as any);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockSession = {
        user: { id: 'cuid123', email: 'test@example.com' },
        session: {},
      };
      const mockProfile = {
        id: 'cuid123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'CANDIDATE',
      };

      authServiceMock.getProfile.mockResolvedValue(mockProfile);

      const result = await controller.getProfile(mockSession as any);
      expect(result).toEqual({ user: mockProfile });
      expect(authServiceMock.getProfile).toHaveBeenCalledWith('cuid123');
    });
  });

  describe('updateProfile', () => {
    it('should update and return user profile', async () => {
      const mockSession = {
        user: { id: 'cuid123', email: 'test@example.com' },
        session: {},
      };
      const mockUpdated = {
        id: 'cuid123',
        name: 'Updated',
        email: 'test@example.com',
        role: 'CANDIDATE',
        phone: '0123456789',
      };

      authServiceMock.updateProfile.mockResolvedValue(mockUpdated);

      const result = await controller.updateProfile(mockSession as any, {
        name: 'Updated',
        phone: '0123456789',
      });

      expect(result).toEqual({ user: mockUpdated });
      expect(authServiceMock.updateProfile).toHaveBeenCalledWith('cuid123', {
        name: 'Updated',
        phone: '0123456789',
      });
    });
  });

  describe('adminEndpoint', () => {
    it('should return admin message', async () => {
      const result = await controller.adminEndpoint();
      expect(result).toEqual({ message: 'Admin access granted' });
    });
  });
});
