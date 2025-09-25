import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { TokensService } from './tokens.service';
import { ListTokensQuery } from './dto/list-tokens.dto/list-tokens.query';
import { CreateTokenDto } from './dto/create-token.dto/create-token.dto';

@ApiTags('tokens')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('tokens')
export class TokensController {
  constructor(private readonly tokens: TokensService) {}

  @Get()
  @ApiQuery({ name: 'type', required: false, enum: ['both','owner','creator'], example: 'both' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 20 })
  @ApiOkResponse({
    description: 'Tokens do usuário (owner/creator)',
    schema: {
      example: {
        meta: { page: 1, pageSize: 20, total: 1 },
        items: [
          {
            id: 'uuid',
            userId: 'uuid', createdByUserId: 'uuid',
            scope: 'READ_WRITE', isActive: true,
            expiresAt: '2099-01-01T00:00:00.000Z',
            createdAt: '2025-09-24T10:00:00.000Z',
            revokedAt: null,
            description: 'key teste',
            User_Token_userIdToUser: { id: 'uuid', email: 'owner@local.com', role: 'USER' },
            User_Token_createdByUserIdToUser: { id: 'uuid', email: 'admin@local.com', role: 'ADMIN' }
          }
        ]
      }
    }
  })
  async list(@Req() req: any, @Query() q: ListTokensQuery) {
    const me = { id: req.user.sub, role: req.user.role };
    return this.tokens.listForUser(me as any, q);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateTokenDto) {
    const issuer = { id: req.user.sub, role: req.user.role };
    return this.tokens.create(issuer as any, dto);
  }

  @Delete(':id')
  async revoke(@Param('id') id: string) {
    return this.tokens.revoke(id);
  }
}
