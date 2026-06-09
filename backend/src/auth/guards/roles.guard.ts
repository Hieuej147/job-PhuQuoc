import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.user) {
      throw new ForbiddenException('No user found in request');
    }

    const userRole = user.user.role || 'CANDIDATE';

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Role ${userRole} is not authorized. Required: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
