import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaPrimaryService } from '../prisma/prisma-primary.service';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Prisma } from '@db/primary';
type Role = Prisma.$Enums.Role;
type TokenScope = Prisma.$Enums.TokenScope;

const scopeRank: Record<TokenScope, number> = { READ:1, WRITE:2, ADMIN:3 };
const genKey = () => `tok_${crypto.randomBytes(32).toString('base64url')}`;

@Injectable()
export class TokensService {
  constructor(private prisma: PrismaPrimaryService) {}

  async create(issuer: { id: string; role: Role }, dto: { userId?: string; scope: TokenScope; expiresAt: string; description?: string }) {
    if (issuer.role === 'USER' && dto.userId && dto.userId !== issuer.id)
      throw new ForbiddenException('USER não pode criar tokens para outro usuário');

    const ownerId = issuer.role === 'ADMIN' ? (dto.userId ?? issuer.id) : issuer.id;
    const apiKey  = genKey();
    const keyHash = await bcrypt.hash(apiKey, Number(process.env.BCRYPT_SALT_ROUNDS || 10));

    const token = await this.prisma.token.create({
      data: { keyHash, scope: dto.scope, description: dto.description, expiresAt: new Date(dto.expiresAt), ownerId }
    });

    return { apiKey, token };
  }

  async revoke(id: string) {
    await this.prisma.token.update({ where: { id }, data: { revokedAt: new Date() } });
    return { ok: true, id };
  }

  async validateKey(apiKey: string, required: TokenScope) {
    const list = await this.prisma.token.findMany({
      where: { revokedAt: null, expiresAt: { gt: new Date() } },
      include: { owner: { select: { id: true, role: true, email: true } } },
    });

    for (const t of list) {
      if (await bcrypt.compare(apiKey, t.keyHash)) {
        return scopeRank[t.scope] >= scopeRank[required] ? t : null;
      }
    }
    return null;
  }
}
//   async create(issuer: { id: string; role: Role }, dto: CreateTokenDto) {
//     if (issuer.role === 'USER' && dto.userId && dto.userId !== issuer.id)
//       throw new ForbiddenException('USER não pode criar tokens para outro usuário');