import { applyDecorators } from '@nestjs/common';
import { Roles } from './roles.decorator.js';

// applyDecorators bundles several decorators into one name.
// The guards are already global (see AuthModule), so we don't add @UseGuards here:
// that would run them twice. Stack more decorators here as the app grows (e.g. Swagger docs).
export function AdminOnly() {
  return applyDecorators(Roles('ADMIN'));
}
