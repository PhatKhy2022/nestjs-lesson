import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from './jwt-auth.guard.js';

// @CurrentUser() → the whole token payload; @CurrentUser('sub') → just the user id.
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user; // set earlier by JwtAuthGuard
    return data ? user?.[data] : user;
  },
);
