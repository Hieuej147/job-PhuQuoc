import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestPasswordResetUseCase } from '../src/auth/use-cases/request-password-reset.usecase';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
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
      sendVerificationOtp: vi.fn(),
      requestPasswordResetOtp: vi.fn(),
    };
    useCase = new RequestPasswordResetUseCase(prismaMock as any, betterAuthMock as any);
  });

  it('should send reset otp for verified credential user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      emailVerified: true,
    });
    prismaMock.account.findFirst.mockResolvedValue({ id: 'acc1' });
    betterAuthMock.requestPasswordResetOtp.mockResolvedValue({ success: true });

    const result = await useCase.execute({ email: 'Test@example.com' });

    expect(result).toEqual({
      status: 'RESET_OTP_SENT',
      email: 'test@example.com',
    });
    expect(betterAuthMock.requestPasswordResetOtp).toHaveBeenCalledWith('test@example.com');
  });

  it('should send verify email otp for unverified user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      emailVerified: false,
    });
    prismaMock.account.findFirst.mockResolvedValue({ id: 'acc1' });
    betterAuthMock.sendVerificationOtp.mockResolvedValue({ success: true });

    const result = await useCase.execute({ email: 'Test@example.com' });

    expect(result).toEqual({
      status: 'VERIFY_EMAIL_REQUIRED',
      email: 'test@example.com',
    });
    expect(betterAuthMock.sendVerificationOtp).toHaveBeenCalledWith('test@example.com');
  });

  it('should return oauth only when verified user has no credential account', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      emailVerified: true,
    });
    prismaMock.account.findFirst.mockResolvedValue(null);

    const result = await useCase.execute({ email: 'Test@example.com' });

    expect(result).toEqual({
      status: 'OAUTH_ONLY',
      email: 'test@example.com',
    });
  });

  it('should return email not found for unknown email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const result = await useCase.execute({ email: 'Test@example.com' });

    expect(result).toEqual({
      status: 'EMAIL_NOT_FOUND',
      email: 'test@example.com',
    });
  });
});
