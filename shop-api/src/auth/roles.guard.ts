import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../generated/prisma/client.js';
import type { JwtPayload } from './jwt-auth.guard.js';
import { ROLES_KEY } from './roles.decorator.js';

// The second guard: the badge is valid, but is this person allowed in THIS room?
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true; // no @Roles → any logged-in user

    const { user } = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
