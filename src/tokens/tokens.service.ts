import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaPrimaryService } from '../prisma/prisma-primary.service';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { Role, TokenScope } from 'src/common/types/enums';
import type { TokenScope as DbTokenScope } from '@db/primary';

const genId = () => crypto.randomUUID();
const genApiKey = () => `tok_${crypto.randomBytes(32).toString('base64url')}`;

// Regra de escopo (WRITE não cobre READ; READ_WRITE cobre ambos)
const CAN: Record<'READ' | 'WRITE', Set<TokenScope>> = {
  READ: new Set<TokenScope>(['READ', 'READ_WRITE']),
  WRITE: new Set<TokenScope>(['WRITE', 'READ_WRITE']),
};

@Injectable()
export class TokensService {
  constructor(private prisma: PrismaPrimaryService) {}

  /** Criação de token */
  async create(
    issuer: { id: string; role: Role },
    dto: { userId?: string; scope: TokenScope; expiresAt: string; description?: string }
  ) {
    // USER: não cria para terceiros
    if (issuer.role === 'USER' && dto.userId && dto.userId !== issuer.id) {
      throw new ForbiddenException('USER não pode criar tokens para outro usuário');
    }

    // USER: só pode criar READ
    if (issuer.role === 'USER' && dto.scope !== 'READ') {
      throw new ForbiddenException('USER só pode criar tokens com escopo READ');
    }

    // expiresAt obrigatório e futuro
    if (!dto.expiresAt) {
      throw new BadRequestException('expiresAt é obrigatório');
    }
    const expiresAt = new Date(dto.expiresAt);
    if (isNaN(expiresAt.getTime())) {
      throw new BadRequestException('expiresAt inválido');
    }
    if (expiresAt <= new Date()) {
      throw new BadRequestException('expiresAt deve ser uma data futura');
    }

    const targetUserId = issuer.role === 'ADMIN' ? (dto.userId ?? issuer.id) : issuer.id;

    const apiKey = genApiKey();
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const tokenHash = await bcrypt.hash(apiKey, saltRounds);

    const created = await this.prisma.token.create({
      data: {
        id: genId(),
        userId: targetUserId,       // dono
        createdByUserId: issuer.id, // criador
        tokenHash,
        scope: dto.scope as DbTokenScope,
        description: dto.description,
        expiresAt,
      },
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
        User_Token_userIdToUser: {
          select: { id: true, name: true, email: true },
        },
        User_Token_createdByUserIdToUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const tokenView = {
      id: created.id,
      userId: created.userId,
      createdByUserId: created.createdByUserId,
      scope: created.scope as TokenScope,
      isActive: created.isActive,
      expiresAt: created.expiresAt.toISOString(),
      createdAt: created.createdAt.toISOString(),
      revokedAt: created.revokedAt ? created.revokedAt.toISOString() : null,
      description: created.description ?? null,
      ownerName: created.User_Token_userIdToUser?.name ?? null,
      ownerEmail: created.User_Token_userIdToUser?.email ?? null,
      createdByName: created.User_Token_createdByUserIdToUser?.name ?? null,
      createdByEmail: created.User_Token_createdByUserIdToUser?.email ?? null,
    };

    return { token: tokenView, apiKey };
  }

  /** Revogação de token com checagem de permissão (ADMIN / owner / creator). Idempotente. */
  async revoke(id?: string, issuer?: { id: string; role: Role }) {
    if (!id) throw new BadRequestException('tokenId obrigatório');

    const token = await this.prisma.token.findUnique({ where: { id } });
    if (!token) throw new NotFoundException('Token não encontrado');

    // permissão
    const isAdmin = issuer?.role === 'ADMIN';
    const isOwner = issuer?.id === token.userId;
    const isCreator = issuer?.id === token.createdByUserId;
    if (!isAdmin && !isOwner && !isCreator) {
      throw new ForbiddenException('Você não tem permissão para revogar este token');
    }

    if (!token.isActive || token.revokedAt) {
      return { ok: true, id, alreadyRevoked: true };
    }

    await this.prisma.token.update({
      where: { id },
      data: { revokedAt: new Date(), isActive: false },
    });

    return { ok: true, id, alreadyRevoked: false };
  }

  /** Validação de apiKey por escopo requerido (WRITE não autoriza GET). */
  async validateKey(apiKey: string, required: TokenScope) {
    const candidates = await this.prisma.token.findMany({
      where: {
        isActive: true,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        User_Token_userIdToUser: { select: { id: true, role: true, email: true } },
        User_Token_createdByUserIdToUser: { select: { id: true, role: true, email: true } },
      },
    });

    for (const t of candidates) {
      if (await bcrypt.compare(apiKey, t.tokenHash)) {
        const tokenScope = t.scope as unknown as TokenScope;

        // required será 'READ' para GET e 'WRITE' para POST/PUT/PATCH/DELETE no seu guard
        const ok =
          required === 'READ'
            ? CAN.READ.has(tokenScope)
            : required === 'WRITE'
            ? CAN.WRITE.has(tokenScope)
            : tokenScope === 'READ_WRITE'; // fallback se alguém passar 'READ_WRITE' explicitamente

        if (ok) return t;
        return null;
      }
    }
    return null;
  }

  /** Lista tokens onde o usuário é dono (owner) e/ou criador (creator) */
  async listForUser(
    me: { id: string; role: Role },
    q: { type?: 'both' | 'owner' | 'creator'; page?: number; pageSize?: number }
  ) {
    const page = q.page ?? 1;
    const take = q.pageSize ?? 20;
    const skip = (page - 1) * take;

    const ownerCond = { userId: me.id };
    const creatorCond = { createdByUserId: me.id };
    const where =
      q.type === 'owner'
        ? ownerCond
        : q.type === 'creator'
        ? creatorCond
        : { OR: [ownerCond, creatorCond] };

    const [rows, total] = await Promise.all([
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
          User_Token_userIdToUser: { select: { id: true, name: true, email: true } },
          User_Token_createdByUserIdToUser: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.token.count({ where }),
    ]);

    const items = rows.map((t) => ({
      id: t.id,
      userId: t.userId,
      createdByUserId: t.createdByUserId,
      scope: t.scope as TokenScope,
      isActive: t.isActive,
      expiresAt: t.expiresAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
      revokedAt: t.revokedAt ? t.revokedAt.toISOString() : null,
      description: t.description ?? null,
      ownerName: t.User_Token_userIdToUser?.name ?? null,
      ownerEmail: t.User_Token_userIdToUser?.email ?? null,
      createdByName: t.User_Token_createdByUserIdToUser?.name ?? null,
      createdByEmail: t.User_Token_createdByUserIdToUser?.email ?? null,
    }));

    return { meta: { page, pageSize: take, total }, items };
  }
}
