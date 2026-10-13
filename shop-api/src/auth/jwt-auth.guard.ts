import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';
import type { Role } from '../generated/prisma/client.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';

// What we put inside the token at login (see AuthService.login).
export interface JwtPayload {
  sub: number; // the user id
  email: string;
  role: Role;
}

// The security guard at the entrance: checks the badge (Bearer token) on every request.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // @Public() routes skip the check. Method-level metadata wins over class-level.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: JwtPayload }>();
    const [type, token] = req.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) throw new UnauthorizedException();

    try {
      req.user = await this.jwt.verifyAsync<JwtPayload>(token); // secret comes from JwtModule config
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return true; // later layers can now read req.user
  }
}
