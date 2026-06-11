import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { RegisterEmailUseCase } from '../src/auth/use-cases/register-email.usecase';
import { BetterAuthService } from '../src/auth/better-auth.service';

describe('RegisterEmailUseCase', () => {
  let useCase: RegisterEmailUseCase;
  let prismaMock: any;
  let betterAuthMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
      },
      account: {
        findFirst: vi.fn(),
      },
    };
    betterAuthMock = {
      signUpEmail: vi.fn(),
      sendVerificationOtp: vi.fn(),
    };
    useCase = new RegisterEmailUseCase(prismaMock as any, betterAuthMock as BetterAuthService);
  });

  it('should sign up new email and return verify email status', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    betterAuthMock.signUpEmail.mockResolvedValue({ ok: true });

    const result = await useCase.execute({
      name: 'Test User',
      email: 'Test@example.com',
      password: 'password123',
      role: 'CANDIDATE',
    });

    expect(result).toEqual({
      status: 'VERIFY_EMAIL',
      email: 'test@example.com',
      role: 'CANDIDATE',
    });
    expect(betterAuthMock.signUpEmail).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'CANDIDATE',
    });
  });

  it('should send verification otp for existing oauth user with same role', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      role: 'EMPLOYER',
    });
    prismaMock.account.findFirst.mockResolvedValue(null);
    betterAuthMock.sendVerificationOtp.mockResolvedValue({ ok: true });

    const result = await useCase.execute({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'EMPLOYER',
    });

    expect(result).toEqual({
      status: 'VERIFY_EMAIL',
      email: 'test@example.com',
      role: 'EMPLOYER',
    });
    expect(betterAuthMock.sendVerificationOtp).toHaveBeenCalledWith('test@example.com');
  });

  it('should reject when role differs', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      role: 'EMPLOYER',
    });

    await expect(
      useCase.execute({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'CANDIDATE',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should reject when credential account already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      role: 'EMPLOYER',
    });
    prismaMock.account.findFirst.mockResolvedValue({ id: 'acc1' });

    await expect(
      useCase.execute({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'EMPLOYER',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
