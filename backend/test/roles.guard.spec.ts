import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../src/auth/guards/roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function mockContext(user?: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user: user || null,
        }),
      }),
      getHandler: () => () => {},
      getClass: () => class {},
    } as any;
  }

  it('should allow access when no roles required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('should allow access when user has required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const ctx = mockContext({ user: { role: 'ADMIN' } });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access when user lacks required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const ctx = mockContext({ user: { role: 'CANDIDATE' } });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should deny access when no user in request', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    expect(() => guard.canActivate(mockContext())).toThrow(ForbiddenException);
  });
});
