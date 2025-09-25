import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaPrimaryService } from '../prisma/prisma-primary.service';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { Role, TokenScope } from 'src/common/types/enums';
import type { TokenScope as DbTokenScope } from '@db/primary';

const scopeRank: Record<TokenScope, number> = { READ: 1, WRITE: 2, READ_WRITE: 3 };
const genId = () => crypto.randomUUID(); // seu model Token.id não tem default
const genApiKey = () => `tok_${crypto.randomBytes(32).toString('base64url')}`;

@Injectable()
export class TokensService {
  constructor(private prisma: PrismaPrimaryService) {}

  async create(
    issuer: { id: string; role: Role },
    dto: { userId?: string; scope: TokenScope; expiresAt: string; description?: string }
  ) {
    // USER não cria para terceiros
    if (issuer.role === 'USER' && dto.userId && dto.userId !== issuer.id) {
      throw new ForbiddenException('USER não pode criar tokens para outro usuário');
    }

    const targetUserId = issuer.role === 'ADMIN' ? (dto.userId ?? issuer.id) : issuer.id;

    const apiKey    = genApiKey();
    const tokenHash = await bcrypt.hash(apiKey, Number(process.env.BCRYPT_SALT_ROUNDS || 10));

    const token = await this.prisma.token.create({
      data: {
        id: genId(),
        userId: targetUserId,           // dono do token (quem vai usar)
        createdByUserId: issuer.id,     // quem criou
        tokenHash,                      // <- nome do campo no seu schema
        scope: dto.scope as DbTokenScope,
        description: dto.description,
        expiresAt: new Date(dto.expiresAt),
        // isActive default true; createdAt default now()
      },
    });

    return { apiKey, token };
  }

  async revoke(id: string) {
    await this.prisma.token.update({
      where: { id },
      data: { revokedAt: new Date(), isActive: false },
    });
    return { ok: true, id };
  }

  async validateKey(apiKey: string, required: TokenScope) {
    const candidates = await this.prisma.token.findMany({
      where: {
        isActive: true,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        User_Token_userIdToUser:         { select: { id: true, role: true, email: true } }, // dono
        User_Token_createdByUserIdToUser:{ select: { id: true, role: true, email: true } }, // criador
      },
    });

    for (const t of candidates) {
      if (await bcrypt.compare(apiKey, t.tokenHash)) {
        const tokenScope = t.scope as unknown as TokenScope;
        if (scopeRank[tokenScope] >= scopeRank[required]) return t;
        return null;
      }
    }
    return null;
  }

  async listForUser(
    me: { id: string; role: Role },
    q: { type?: 'both' | 'owner' | 'creator'; page?: number; pageSize?: number }
  ) {
    const page = q.page ?? 1;
    const take = q.pageSize ?? 20;
    const skip = (page - 1) * take;

    const ownerCond   = { userId: me.id };
    const creatorCond = { createdByUserId: me.id };
    const where =
      q.type === 'owner'   ? ownerCond :
      q.type === 'creator' ? creatorCond :
      { OR: [ownerCond, creatorCond] };

    const [items, total] = await Promise.all([
      this.prisma.token.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          userId: true,
          createdByUserId: true,
          scope: true,
          isActive: true,
          expiresAt: true,
          createdAt: true,
          revokedAt: true,
          description: true,
          User_Token_userIdToUser:          { select: { id: true, email: true, role: true } },
          User_Token_createdByUserIdToUser: { select: { id: true, email: true, role: true } },
        },
      }),
      this.prisma.token.count({ where }),
    ]);

    return {
      meta: { page, pageSize: take, total },
      items,
    };
  }
}
