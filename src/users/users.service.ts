// src/users/users.service.ts
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaPrimaryService } from '../prisma/prisma-primary.service';
import * as bcrypt from 'bcrypt';
import {
  CreateUserDto,
  UpdateOwnPasswordDto,
  UpdateOwnProfileDto,
  UpdateUserAdminDto,
} from './dto/user.dto';
import { randomUUID } from 'crypto';
import { userSelectPublic } from './user.select';
import { Prisma } from '@db/primary';
import { PublicUser, Role } from './user.types';

type PublicUserDto = Omit<PublicUser, 'createdAt'> & { createdAt: string };

const SALT_ROUNDS = 10;

function toUserDto(u: PublicUser): PublicUserDto {
  return { ...u, createdAt: u.createdAt.toISOString() };
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaPrimaryService) {}

  // =========================
  // LIST / GET
  // =========================
  async list(page = 1, pageSize = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeSize = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const take = safeSize;
    const skip = (safePage - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        select: userSelectPublic, // inclui isActive
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      page: safePage,
      pageSize: take,
      total,
      items: items.map((u) => toUserDto(u as PublicUser)),
    };
  }

  async getOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelectPublic, // inclui isActive
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return toUserDto(user as PublicUser);
  }

  // =========================
  // CREATE / UPDATE (ADMIN)
  // =========================
  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const user = await this.prisma.user.create({
        data: {
          // remova se o modelo já tem default(uuid())
          id: randomUUID(),
          email: dto.email,
          name: dto.name,
          role: (dto.role as Role) ?? Role.USER,
          password: passwordHash,
          isActive: dto.isActive ?? true, // usa o default da API; no banco tbm é default(true)
        } satisfies Prisma.UserCreateInput,
        select: userSelectPublic,
      });
      return toUserDto(user as PublicUser);
    } catch (e: any) {
      if (e?.code === 'P2002' && e?.meta?.target?.includes('email')) {
        throw new ConflictException('E-mail já cadastrado.');
      }
      throw e;
    }
  }

  async updateAdmin(dto: UpdateUserAdminDto) {
    const data: Prisma.UserUpdateInput = {};
    if (dto.email) data.email = dto.email;
    if (dto.name) data.name = dto.name;
    if (dto.role) data.role = dto.role as any;
    if (dto.password) data.password = await bcrypt.hash(dto.password, SALT_ROUNDS);
    if (typeof dto.isActive === 'boolean') data.isActive = dto.isActive;

    try {
      const user = await this.prisma.user.update({
        where: { id: dto.id },
        data,
        select: userSelectPublic,
      });
      return toUserDto(user as PublicUser);
    } catch (e: any) {
      if (e?.code === 'P2002' && e?.meta?.target?.includes('email')) {
        throw new ConflictException('E-mail já cadastrado.');
      }
      if (e?.code === 'P2025') {
        throw new NotFoundException('Usuário não encontrado.');
      }
      throw e;
    }
  }

  // =========================
  // ATIVAÇÃO / DESATIVAÇÃO
  // =========================

  /** Desativar = marca User como inativo e revoga tokens válidos (transacional) */
  async deactivate(userId: string) {
    const now = new Date();

    const revoked = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!u) throw new NotFoundException('Usuário não encontrado.');

      await tx.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      const res = await tx.token.updateMany({
        where: { userId, isActive: true, expiresAt: { gt: now } },
        data: { isActive: false, revokedAt: now },
      });

      return res.count;
    });

    return { success: true, isActive: false, revoked };
  }

  /** Ativar = marca User como ativo (não cria/reativa tokens) */
  async activate(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });
    if (!u) throw new NotFoundException('Usuário não encontrado.');

    if (u.isActive) {
      return { success: true, isActive: true, message: 'Usuário já estava ativo.' };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    return { success: true, isActive: true };
  }

  /** Alterna: se ativo → desativa; se inativo → ativa (transacional) */
  async toggle(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const u = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, isActive: true },
      });
      if (!u) throw new NotFoundException('Usuário não encontrado.');

      if (u.isActive) {
        const now = new Date();
        await tx.user.update({ where: { id: userId }, data: { isActive: false } });
        const res = await tx.token.updateMany({
          where: { userId, isActive: true, expiresAt: { gt: now } },
          data: { isActive: false, revokedAt: now },
        });
        return { success: true, isActive: false, revoked: res.count };
      }

      await tx.user.update({ where: { id: userId }, data: { isActive: true } });
      return { success: true, isActive: true, revoked: 0 };
    });
  }

  // =========================
  // DELETE
  // =========================
  async remove(id: string) {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.token.updateMany({
          where: { userId: id, isActive: true },
          data: { isActive: false, revokedAt: new Date() },
        });
        await tx.user.delete({ where: { id } });
      });
      return { success: true };
    } catch (e: any) {
      if (e?.code === 'P2025') {
        throw new NotFoundException('Usuário não encontrado.');
      }
      throw e;
    }
  }

  // =========================
  // SELF SERVICE
  // =========================
  async updateOwnProfile(userId: string, dto: UpdateOwnProfileDto) {
    const data: Prisma.UserUpdateInput = {};
    if (dto.email) data.email = dto.email;
    if (dto.name) data.name = dto.name;

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: userSelectPublic,
      });
      return toUserDto(user as PublicUser);
    } catch (e: any) {
      if (e?.code === 'P2002' && e?.meta?.target?.includes('email')) {
        throw new ConflictException('E-mail já cadastrado.');
      }
      if (e?.code === 'P2025') {
        throw new NotFoundException('Usuário não encontrado.');
      }
      throw e;
    }
  }

  async updateOwnPassword(userId: string, dto: UpdateOwnPasswordDto) {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!me) throw new NotFoundException('Usuário não encontrado.');

    const ok = await bcrypt.compare(dto.currentPassword, me.password);
    if (!ok) throw new UnauthorizedException('Senha atual inválida.');

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: await bcrypt.hash(dto.newPassword, SALT_ROUNDS) },
      }),
      this.prisma.token.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false, revokedAt: new Date() },
      }),
    ]);

    return { success: true };
  }
}
