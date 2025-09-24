import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_SCOPE_KEY } from '../decorators/required-scope.decorator';
import { Prisma } from '@db/primary';
import { TokensService } from 'src/tokens/tokens.service';
type TokenScope = Prisma.$Enums.TokenScope;

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly tokens: TokensService, private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const required = (this.reflector.get<TokenScope>(REQUIRED_SCOPE_KEY, ctx.getHandler()) ?? 'READ') as TokenScope;

    const headerKey = (req.headers['x-api-key'] as string)
      || (String(req.headers['authorization'] || '').startsWith('Bearer ') ? String(req.headers['authorization']).slice(7) : '');
    const queryKey = req.method === 'GET' ? (req.query?.apikey as string) : '';

    const key = headerKey || queryKey;
    if (!key) throw new UnauthorizedException('API key ausente');

    const token = await this.tokens.validateKey(key, required);
    if (!token) throw new ForbiddenException('API key inválida/expirada/sem escopo');

    (req as any).apiToken = token;
    return true;
  }
}
