// src/common/guards/api-key.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_SCOPE_KEY } from '../decorators/required-scope.decorator';
import { TokensService } from 'src/tokens/tokens.service';
import { TokenScope } from 'src/common/types/enums';
import type { Request } from 'express';

type H = string | string[] | undefined;
const first = (v: H) => (Array.isArray(v) ? v[0] : v);

const inferRequiredScope = (method: string): TokenScope =>
  ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase()) ? 'READ' : 'WRITE';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly tokens: TokensService,
    private readonly reflector: Reflector,
  ) {}

  /** Extrai apiKey de header, bearer ou query (apenas GET). */
  private extractApiKey(req: Request): string {
    const fromHeaders =
      first(req.headers['x-api-key']) ??
      first(req.headers['apikey']) ??
      first(req.headers['api-key']);

    const auth = first(req.headers['authorization']);
    const fromBearer = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : undefined;

    const fromQuery = typeof (req.query as any)?.apikey === 'string' ? (req.query as any).apikey : undefined;

    if (req.method !== 'GET' && fromQuery) {
      throw new UnauthorizedException('API key na URL só é permitida em requisições GET');
    }

    const apiKey = fromHeaders || fromBearer || fromQuery;
    if (!apiKey) {
      throw new UnauthorizedException('API key ausente (x-api-key/api-key/apikey/Bearer)');
    }
    return apiKey;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();

    // 1) Determina escopo requerido
    const decorated = this.reflector.get<TokenScope>(REQUIRED_SCOPE_KEY, ctx.getHandler());
    const required = decorated ?? inferRequiredScope(req.method);

    // 2) Extrai e valida apiKey
    const apiKey = this.extractApiKey(req);
    const token = await this.tokens.validateKey(apiKey, required);
    if (!token) {
      throw new ForbiddenException('API key inválida/expirada/revogada ou sem escopo suficiente');
    }

    // 3) Disponibiliza token no request
    (req as any).apiToken = token;
    return true;
  }
}
