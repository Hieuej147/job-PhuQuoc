import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../src/auth/guards/auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let authServiceMock: any;
  let configServiceMock: any;
  let prismaMock: any;

  beforeEach(() => {
    reflector = new Reflector();
    authServiceMock = {
      api: {
        getSession: vi.fn(),
      },
    };
    configServiceMock = {
      get: vi.fn().mockReturnValue('http://localhost:3000'),
    };
    prismaMock = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'u1',
          email: 'test@test.com',
          name: 'Test',
          role: 'CANDIDATE',
          emailVerified: true,
          isActive: true,
          isLocked: false,
        }),
      },
    };
    guard = new AuthGuard(reflector, configServiceMock, authServiceMock, prismaMock);
  });

  function mockContext(cookies?: any, headers?: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          cookies: cookies || {},
          headers: headers || {},
        }),
      }),
      getHandler: () => () => {},
      getClass: () => class {},
    } as any;
  }

  it('should allow access when route is public', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const result = await guard.canActivate(mockContext());
    expect(result).toBe(true);
  });

  it('should reject when no auth provided', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    await expect(guard.canActivate(mockContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should verify session cookie when present', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    authServiceMock.api.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'test@test.com', name: 'Test', role: 'CANDIDATE', isActive: true, isLocked: false },
      session: { id: 's1' },
    });

    const ctx = mockContext(
      { 'better-auth.session_token': 'session123' },
      { cookie: 'better-auth.session_token=session123' },
    );

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
    expect(authServiceMock.api.getSession).toHaveBeenCalled();
  });

  it('should reject invalid session', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    authServiceMock.api.getSession.mockResolvedValue(null);

    const ctx = mockContext(
      { 'better-auth.session_token': 'invalid' },
      { cookie: 'better-auth.session_token=invalid' },
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should reject deactivated user (isActive=false)', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    authServiceMock.api.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'test@test.com', name: 'Test', role: 'CANDIDATE' },
      session: { id: 's1' },
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'test@test.com',
      name: 'Test',
      role: 'CANDIDATE',
      emailVerified: true,
      isActive: false,
      isLocked: false,
    });

    const ctx = mockContext(
      { 'better-auth.session_token': 'session123' },
      { cookie: 'better-auth.session_token=session123' },
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should reject locked user (isLocked=true)', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    authServiceMock.api.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'test@test.com', name: 'Test', role: 'CANDIDATE' },
      session: { id: 's1' },
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'test@test.com',
      name: 'Test',
      role: 'CANDIDATE',
      emailVerified: true,
      isActive: true,
      isLocked: true,
    });

    const ctx = mockContext(
      { 'better-auth.session_token': 'session123' },
      { cookie: 'better-auth.session_token=session123' },
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
