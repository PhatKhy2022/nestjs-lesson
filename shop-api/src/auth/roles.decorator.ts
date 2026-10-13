import { SetMetadata } from '@nestjs/common';
import type { Role } from '../generated/prisma/client.js';

// @Roles('ADMIN') writes "who may enter" on a route. RolesGuard reads it.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
