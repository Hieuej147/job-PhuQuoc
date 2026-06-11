import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CompleteEmailRegistrationUseCase } from '../src/auth/use-cases/complete-email-registration.usecase';
import { BadRequestException } from '@nestjs/common';

vi.mock('better-auth/crypto', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
}));

describe('CompleteEmailRegistrationUseCase', () => {
  let useCase: CompleteEmailRegistrationUseCase;
  let prismaMock: any;
  let betterAuthMock: any;

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
    betterAuthMock = {
      checkVerificationOtp: vi.fn(),
    };
    useCase = new CompleteEmailRegistrationUseCase(prismaMock as any, betterAuthMock as any);
  });

  it('should verify otp and create credential account when missing', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: false,
      image: null,
      role: 'EMPLOYER',
      phone: null,
    });
    prismaMock.account.findFirst.mockResolvedValue(null);
    prismaMock.user.update.mockResolvedValue({
      id: 'u1',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      image: null,
      role: 'EMPLOYER',
      phone: null,
    });

    const result = await useCase.execute({
      email: 'test@example.com',
      otp: '123456',
      password: 'password123',
    });

    expect(result.user.emailVerified).toBe(true);
    expect(betterAuthMock.checkVerificationOtp).toHaveBeenCalledWith('test@example.com', '123456');
    expect(prismaMock.account.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        accountId: 'u1',
        providerId: 'credential',
        password: 'hashed-password',
      },
    });
  });

  it('should reject when user not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'test@example.com',
        otp: '123456',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
