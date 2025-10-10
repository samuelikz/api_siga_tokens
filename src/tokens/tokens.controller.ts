// src/tokens/tokens.controller.ts
import {
  Body, Controller, Delete, Get, Post, Query, Req,
  UseGuards, BadRequestException, UsePipes, ValidationPipe, HttpCode, Headers
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { TokensService } from './tokens.service';
import { CreateTokenDto } from './dto/create-token.dto';
import { DeleteTokenDto } from './dto/delete-token.dto';
import { ListTokensQuery } from './dto/list-tokens.query';
import type { Role } from 'src/common/types/enums';

type Issuer = { id: string; role: Role };
const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

@UseGuards(JwtAuthGuard)
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokens: TokensService) { }

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

  /**
   * DELETE /tokens — se ATIVO: revoga; se INATIVO: deleta definitivamente.
   * tokenId via header (x-token-id | tokenid | token-id) ou body { tokenId }.
   * Proibido enviar tokenId na query string.
   */
  @Delete()
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async deleteOrRevoke(
    @Req() req: any,
    @Headers() h: Record<string, string | string[] | undefined>,
    @Body() body: DeleteTokenDto,
  ) {
    if (typeof req.query?.tokenId === 'string') {
      throw new BadRequestException('tokenId não pode ser enviado na URL (query string).');
    }

    const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
    const fromHeader = first(h['x-token-id']) ?? first(h['tokenid']) ?? first(h['token-id']);
    const tokenId = fromHeader ?? body?.tokenId;

    if (!tokenId) {
      throw new BadRequestException(
        'Informe o tokenId via header (x-token-id | tokenid | token-id) ou no body { tokenId }.'
      );
    }

    return this.tokens.deleteOrRevoke(tokenId, this.getIssuer(req));
  }
}
