import { Body, Controller, Delete, Param, Post, Req, UseGuards } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { CreateTokenDto } from './dto/create-token.dto/create-token.dto';

@Controller('tokens')
@UseGuards(JwtAuthGuard)   // PRIMÁRIA = JWT
export class TokensController {
  constructor(private readonly tokens: TokensService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateTokenDto) {
    const issuer = { id: req.user.userId, role: req.user.role };
    return this.tokens.create(issuer as any, dto);
  }

  @Delete(':id')
  async revoke(@Param('id') id: string) {
    return this.tokens.revoke(id);
  }
}
