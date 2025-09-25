// src/common/guards/api-key.guard.ts
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_SCOPE_KEY } from '../decorators/required-scope.decorator';
import { TokensService } from 'src/tokens/tokens.service';
import { TokenScope } from 'src/common/types/enums';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly tokens: TokensService, private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const required = (this.reflector.get<TokenScope>(REQUIRED_SCOPE_KEY, ctx.getHandler()) ?? 'READ') as TokenScope;

    // 1) header (x-api-key) OU Authorization: Bearer
    const headerKey =
      (req.headers['x-api-key'] as string) ||
      (String(req.headers['authorization'] || '').startsWith('Bearer ')
        ? String(req.headers['authorization']).slice(7)
        : '');

    // 2) query só é permitido em GET
    const queryKey = req.method === 'GET' ? (req.query?.apikey as string) : '';

    // Se vier apikey na URL em método diferente de GET, rejeita explicitamente
    if (req.method !== 'GET' && typeof req.query?.apikey === 'string') {
      throw new UnauthorizedException('API key na URL só é permitida em requisições GET');
    }

    const key = headerKey || queryKey;
    if (!key) throw new UnauthorizedException('API key ausente');

    const token = await this.tokens.validateKey(key, required);
    if (!token) throw new ForbiddenException('API key inválida/expirada/sem escopo');

    (req as any).apiToken = token;
    return true;
  }
}
