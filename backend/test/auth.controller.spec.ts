import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomAuthController } from '../src/auth/auth.controller';

describe('CustomAuthController', () => {
  let controller: CustomAuthController;
  let authServiceMock: any;

  beforeEach(() => {
    authServiceMock = {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      selectRole: vi.fn(),
    };
    controller = new CustomAuthController(authServiceMock as any, {
      execute: vi.fn(),
    } as any, {
      execute: vi.fn(),
    } as any, {
      execute: vi.fn(),
    } as any);
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

  describe('selectRole', () => {
    it('should select and return user role', async () => {
      const mockSession = {
        user: { id: 'cuid123', email: 'test@example.com' },
        session: {},
      };
      const mockUpdated = {
        id: 'cuid123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'EMPLOYER',
        phone: null,
      };

      authServiceMock.selectRole.mockResolvedValue(mockUpdated);

      const result = await controller.selectRole(mockSession as any, {
        role: 'EMPLOYER',
      });

      expect(result).toEqual({ user: mockUpdated });
      expect(authServiceMock.selectRole).toHaveBeenCalledWith(
        'cuid123',
        'EMPLOYER',
      );
    });
  });

  describe('registerEmail', () => {
    it('should delegate register flow to use case', async () => {
      const useCase = {
        execute: vi.fn().mockResolvedValue({
          status: 'VERIFY_EMAIL',
          email: 'test@example.com',
          role: 'CANDIDATE',
        }),
      };
      controller = new CustomAuthController(authServiceMock as any, useCase as any, {
        execute: vi.fn(),
      } as any, {
        execute: vi.fn(),
      } as any);

      const result = await controller.registerEmail({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'CANDIDATE',
      } as any);

      expect(result).toEqual({
        status: 'VERIFY_EMAIL',
        email: 'test@example.com',
        role: 'CANDIDATE',
      });
      expect(useCase.execute).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'CANDIDATE',
      });
    });
  });

  describe('completeEmailRegistration', () => {
    it('should delegate complete flow to use case', async () => {
      const useCase = {
        execute: vi.fn().mockResolvedValue({
          user: {
            id: 'cuid123',
            name: 'Test User',
            email: 'test@example.com',
            emailVerified: true,
            image: null,
            role: 'CANDIDATE',
            phone: null,
          },
        }),
      };
      controller = new CustomAuthController(authServiceMock as any, {
        execute: vi.fn(),
      } as any, useCase as any, {
        execute: vi.fn(),
      } as any);

      const result = await controller.completeEmailRegistration({
        email: 'test@example.com',
        otp: '123456',
        password: 'password123',
      } as any);

      expect(result).toEqual({
        user: {
          id: 'cuid123',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          role: 'CANDIDATE',
          phone: null,
        },
      });
      expect(useCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        otp: '123456',
        password: 'password123',
      });
    });
  });

  describe('requestPasswordReset', () => {
    it('should delegate forgot password flow to use case', async () => {
      const useCase = {
        execute: vi.fn().mockResolvedValue({
          status: 'RESET_OTP_SENT',
          email: 'test@example.com',
        }),
      };
      controller = new CustomAuthController(
        authServiceMock as any,
        {
          execute: vi.fn(),
        } as any,
        {
          execute: vi.fn(),
        } as any,
        useCase as any,
      );

      const result = await controller.requestPasswordReset({
        email: 'test@example.com',
      } as any);

      expect(result).toEqual({
        status: 'RESET_OTP_SENT',
        email: 'test@example.com',
      });
      expect(useCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });
});
