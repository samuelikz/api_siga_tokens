// src/tokens/tokens-admin.controller.ts
import {
  Controller, Get, Query, Req, UseGuards, UsePipes, ValidationPipe, ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { TokensService } from './tokens.service';
import type { Role } from 'src/common/types/enums';
import { ListAllTokensQuery } from './dto/list-all-tokens.query';

type Issuer = { id: string; role: Role };

@UseGuards(JwtAuthGuard)
@Controller('tokensall')
export class TokensAdminController {
  constructor(private readonly tokens: TokensService) {}

  private getIssuer(req: any): Issuer {
    const id = req?.user?.userId ?? req?.user?.id ?? req?.user?.sub;
    const role = req?.user?.role;
    return { id, role };
  }

  /** GET /tokensall — ADMIN lista todos os tokens */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async listAll(@Req() req: any, @Query() q: ListAllTokensQuery) {
    const me = this.getIssuer(req);
    if (me.role !== 'ADMIN') throw new ForbiddenException('Apenas ADMIN pode listar todos os tokens');
    return this.tokens.listAll(q);
  }
}
