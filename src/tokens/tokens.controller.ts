// src/tokens/tokens.controller.ts
import {
  Body, Controller, Delete, Get, Headers, Post, Query, Req,
  UseGuards, BadRequestException, UsePipes, ValidationPipe, HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { TokensService } from './tokens.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { ListTokensQuery } from './dto/list-tokens.query';
import { RevokeTokenDto } from './dto/revoke-token.dto';
import type { Role } from 'src/common/types/enums';

type Issuer = { id: string; role: Role };
const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

@UseGuards(JwtAuthGuard)
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokens: TokensService) {}

  /** Extrai o usuário autenticado do req.user em formatos comuns. */
  private getIssuer(req: any): Issuer {
    const id = req?.user?.userId ?? req?.user?.id ?? req?.user?.sub;
    const role = req?.user?.role;
    return { id, role };
  }

  /** GET /tokens — lista do próprio usuário (owner/creator) */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async list(@Req() req: any, @Query() q: ListTokensQuery) {
    return this.tokens.listForUser(this.getIssuer(req), q);
  }

  /** POST /tokens — cria token */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Req() req: any, @Body() dto: CreateTokenDto) {
    return this.tokens.create(this.getIssuer(req), dto);
  }

  /** DELETE /tokens/by-body — revoga por body.tokenId */
  @Delete('by-body')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async revokeByBody(@Req() req: any, @Body() body: RevokeTokenDto) {
    return this.tokens.revoke(body.tokenId, this.getIssuer(req));
  }

  /** DELETE /tokens — revoga por header (tokenid | x-token-id | token-id) */
  @Delete()
  @HttpCode(200)
  async revokeFromHeader(
    @Req() req: any,
    @Headers() h: Record<string, string | string[] | undefined>,
  ) {
    const tokenId = first(h['tokenid']) ?? first(h['x-token-id']) ?? first(h['token-id']);
    if (!tokenId) {
      throw new BadRequestException('Informe o tokenId no header (tokenid, x-token-id ou token-id)');
    }
    return this.tokens.revoke(tokenId, this.getIssuer(req));
  }
}
