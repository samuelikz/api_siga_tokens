// src/tokens/tokens.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { TokensService } from './tokens.service';
import { CreateTokenDto } from './dto/create-token.dto';

@UseGuards(JwtAuthGuard)
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokens: TokensService) {}

  private getUserFromReq(req: any) {
    const id = req?.user?.userId ?? req?.user?.id ?? req?.user?.sub;
    const role = req?.user?.role;
    return { id, role };
  }

  @Get()
  async list(
    @Req() req: any,
    @Query('type') type: 'both' | 'owner' | 'creator' = 'both',
    @Query('page') page = 1,
    @Query('pageSize') pageSize = Number(process.env.DEFAULT_PAGE_SIZE ?? 20),
  ) {
    const me = this.getUserFromReq(req);
    return this.tokens.listForUser(me as any, {
      type,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateTokenDto) {
    const issuer = this.getUserFromReq(req);
    return this.tokens.create(issuer as any, dto);
  }

  /** Revoga lendo o tokenId de um header (tokenid | x-token-id | token-id) */
  @Delete()
  async revokeFromHeader(
    @Req() req: any,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ) {
    const issuer = this.getUserFromReq(req);

    // Normaliza e tenta achar o header em 3 nomes possíveis
    const pick = (h?: string | string[]) =>
      Array.isArray(h) ? h[0] : h;

    const tokenId =
      pick(headers['tokenid']) ||
      pick(headers['x-token-id']) ||
      pick(headers['token-id']);

    if (!tokenId) {
      throw new BadRequestException(
        'Informe o tokenId no header (tokenid, x-token-id ou token-id).',
      );
    }

    return this.tokens.revoke(tokenId, issuer as any);
  }
}
