// src/common/guards/role/role.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_KEY } from '../../decorations/require-role.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // papéis requeridos no handler/classe
    const required = this.reflector.getAllAndOverride<Array<'ADMIN' | 'USER'>>(
      ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // se não exigiu nenhum papel, segue o fluxo normal
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as { role?: 'ADMIN' | 'USER' } | undefined;

    if (!user || !user.role) {
      throw new ForbiddenException('Acesso negado.');
    }

    if (!required.includes(user.role)) {
      throw new ForbiddenException('Acesso negado.');
    }

    return true;
  }
}
