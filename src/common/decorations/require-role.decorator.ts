// src/common/decorations/require-role.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLE_KEY = 'require_role';
export function RequireRole(...roles: Array<'ADMIN' | 'USER'>) {
  return SetMetadata(ROLE_KEY, roles);
}
