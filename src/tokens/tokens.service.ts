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

type Issuer = { id: string; role: Role };
type ListQuery = { type?: 'both' | 'owner' | 'creator'; page?: number; pageSize?: number };
type ListAllQuery = {
  status?: 'active' | 'revoked' | 'expired';
  scope?: 'READ' | 'WRITE' | 'READ_WRITE';
  ownerId?: string;
  creatorId?: string;
  page?: number;
  pageSize?: number;
};

// ---------- Helpers de chave ----------
const genId = () => crypto.randomUUID();
const genSecret = () => crypto.randomBytes(32).toString('base64url');
const buildApiKey = (id: string, secret: string) => `perpart_${id}.${secret}`;

const parseApiKey = (apiKey: string): { id: string; secret: string } | null => {
  if (!apiKey?.startsWith('perpart_')) return null;
  const dot = apiKey.indexOf('.');
  if (dot < 0) return null;
  const id = apiKey.substring('perpart_'.length, dot);
  const secret = apiKey.substring(dot + 1);
  if (!id || !secret) return null;
  return { id, secret };
};

const hashSecret = async (secret: string) => {
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  return bcrypt.hash(secret, saltRounds);
};
const compareSecret = (secret: string, hash: string) => bcrypt.compare(secret, hash);

// ---------- Escopos ----------
const CAN: Record<'READ' | 'WRITE', Set<TokenScope>> = {
  READ: new Set(['READ', 'READ_WRITE']),
  WRITE: new Set(['WRITE', 'READ_WRITE']),
};

const allows = (required: TokenScope, tokenScope: TokenScope) =>
  required === 'READ'
    ? CAN.READ.has(tokenScope)
    : required === 'WRITE'
    ? CAN.WRITE.has(tokenScope)
    : tokenScope === 'READ_WRITE';

// ---------- Status ----------
const computeStatus = (t: { isActive: boolean; revokedAt: Date | null; expiresAt: Date }) => {
  if (t.revokedAt || !t.isActive) return 'revoked';
  if (t.expiresAt <= new Date()) return 'expired';
  return 'active';
};

// ---------- Service ----------
@Injectable()
export class TokensService {
  constructor(private prisma: PrismaPrimaryService) {}

  /** Cria um token para o owner (ou para si, se USER). Retorna { token, apiKey }. */
  async create(
    issuer: Issuer,
    dto: { userId?: string; scope: TokenScope; expiresAt: string; description?: string },
  ) {
    if (issuer.role === 'USER' && dto.userId && dto.userId !== issuer.id) {
      throw new ForbiddenException('USER não pode criar tokens para outro usuário');
    }
    if (issuer.role === 'USER' && dto.scope !== 'READ') {
      throw new ForbiddenException('USER só pode criar tokens com escopo READ');
    }

    if (!dto.expiresAt) throw new BadRequestException('expiresAt é obrigatório');
    const expiresAt = new Date(dto.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) throw new BadRequestException('expiresAt inválido');
    if (expiresAt <= new Date()) throw new BadRequestException('expiresAt deve ser futura');

    const ownerId = issuer.role === 'ADMIN' ? (dto.userId ?? issuer.id) : issuer.id;

    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) throw new BadRequestException('Usuário alvo não existe');
    if (!owner.isActive) throw new ForbiddenException('Usuário alvo está inativo');

    const id = genId();
    const secret = genSecret();
    const apiKey = buildApiKey(id, secret);
    const tokenHash = await hashSecret(secret);

    const created = await this.prisma.token.create({
      data: {
        id,
        userId: ownerId,
        createdByUserId: issuer.id,
        tokenHash,
        scope: dto.scope as DbTokenScope,
        description: dto.description,
        expiresAt,
      },
      select: {
        id: true, userId: true, createdByUserId: true, scope: true, isActive: true,
        expiresAt: true, createdAt: true, revokedAt: true, description: true,
        User_Token_userIdToUser: { select: { id: true, name: true, email: true } },
        User_Token_createdByUserIdToUser: { select: { id: true, name: true, email: true } },
      },
    });

    const view = {
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

    return { token: view, apiKey };
  }

  /** Revoga um token (ADMIN/owner/creator). Idempotente. */
  async revoke(id?: string, issuer?: Issuer) {
    if (!id) throw new BadRequestException('tokenId obrigatório');

    const token = await this.prisma.token.findUnique({ where: { id } });
    if (!token) throw new NotFoundException('Token não encontrado');

    const isAdmin = issuer?.role === 'ADMIN';
    const isOwner = issuer?.id === token.userId;
    const isCreator = issuer?.id === token.createdByUserId;
    if (!isAdmin && !isOwner && !isCreator) {
      throw new ForbiddenException('Sem permissão para revogar este token');
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

  /** Valida apiKey perpart_<id>.<secret>, escopo requerido e estado do token/owner. */
  async validateKey(apiKey: string, required: TokenScope) {
    const parsed = parseApiKey(apiKey);
    if (!parsed) return null;

    const token = await this.prisma.token.findUnique({
      where: { id: parsed.id },
      include: {
        User_Token_userIdToUser: { select: { id: true, role: true, email: true, isActive: true } },
      },
    });
    if (!token) return null;

    if (!token.isActive || token.revokedAt || token.expiresAt <= new Date()) return null;

    const ok = await compareSecret(parsed.secret, token.tokenHash);
    if (!ok) return null;

    if (!token.User_Token_userIdToUser?.isActive) return null;

    const tokenScope = token.scope as unknown as TokenScope;
    return allows(required, tokenScope) ? token : null;
  }

  /** Lista tokens do usuário autenticado (owner e/ou creator). */
  async listForUser(me: Issuer, q: ListQuery) {
    const page = q.page ?? 1;
    const take = q.pageSize ?? Number(process.env.DEFAULT_PAGE_SIZE ?? 20);
    const skip = (page - 1) * take;

    const byOwner = { userId: me.id };
    const byCreator = { createdByUserId: me.id };
    const where =
      q.type === 'owner' ? byOwner :
      q.type === 'creator' ? byCreator :
      { OR: [byOwner, byCreator] };

    const [rows, total] = await Promise.all([
      this.prisma.token.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true, userId: true, createdByUserId: true, scope: true, isActive: true,
          expiresAt: true, createdAt: true, revokedAt: true, description: true,
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
      status: computeStatus(t),
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

  /** Lista global (ADMIN) com filtros opcionais. */
  async listAll(q: ListAllQuery) {
    const page = q.page ?? 1;
    const take = q.pageSize ?? Number(process.env.DEFAULT_PAGE_SIZE ?? 20);
    const skip = (page - 1) * take;

    const now = new Date();

    const whereBase: any = {};
    if (q.scope) whereBase.scope = q.scope as any;
    if (q.ownerId) whereBase.userId = q.ownerId;
    if (q.creatorId) whereBase.createdByUserId = q.creatorId;

    let where = whereBase;
    if (q.status === 'active') {
      where = { ...whereBase, isActive: true, revokedAt: null, expiresAt: { gt: now } };
    } else if (q.status === 'revoked') {
      where = { ...whereBase, OR: [{ isActive: false }, { revokedAt: { not: null } }] };
    } else if (q.status === 'expired') {
      where = { ...whereBase, isActive: true, revokedAt: null, expiresAt: { lte: now } };
    }

    const [rows, total] = await Promise.all([
      this.prisma.token.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true, userId: true, createdByUserId: true, scope: true, isActive: true,
          expiresAt: true, createdAt: true, revokedAt: true, description: true,
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
      status: computeStatus(t),
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

  /**
   * Se o token estiver ATIVO -> revoga (inativa) e NÃO deleta.
   * Se o token já estiver INATIVO -> deleta definitivamente.
   * Permissões: ADMIN, owner ou creator.
   */
  async deleteOrRevoke(id: string, issuer: Issuer) {
    if (!id) throw new BadRequestException('tokenId obrigatório');

    const token = await this.prisma.token.findUnique({ where: { id } });
    if (!token) throw new NotFoundException('Token não encontrado');

    const isAdmin = issuer.role === 'ADMIN';
    const isOwner = issuer.id === token.userId;
    const isCreator = issuer.id === token.createdByUserId;
    if (!isAdmin && !isOwner && !isCreator) {
      throw new ForbiddenException('Sem permissão para deletar/revogar este token');
    }

    if (token.isActive && !token.revokedAt) {
      await this.prisma.token.update({
        where: { id },
        data: { isActive: false, revokedAt: new Date() },
      });
      return { ok: true, id, action: 'revoked' as const };
    }

    await this.prisma.token.delete({ where: { id } });
    return { ok: true, id, action: 'deleted' as const };
  }
}
