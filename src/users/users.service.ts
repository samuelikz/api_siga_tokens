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

function toUserDto(u: PublicUser): PublicUserDto {
  return { ...u, createdAt: u.createdAt.toISOString() };
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaPrimaryService) {}

  async list(page = 1, pageSize = 20) {
    const take = pageSize;
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        select: userSelectPublic,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return { page, pageSize: take, total, items: items.map(toUserDto) };
  }

  async getOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelectPublic,
    });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return toUserDto(user as PublicUser);
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          // remova se o modelo já tem default(uuid())
          id: randomUUID(),
          email: dto.email,
          name: dto.name,
          role: dto.role ?? Role.USER,
          password: passwordHash,
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
    if (dto.role) data.role = dto.role;
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

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
        // record not found
        throw new NotFoundException('Usuário não encontrado.');
      }
      throw e;
    }
  }

  /** Desativar = revogar todos os tokens do usuário (sem apagar o User) */
  async deactivate(userId: string) {
    // usa transação caso queira adicionar mais efeitos no futuro
    const [u, res] = await this.prisma.$transaction([
      this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
      this.prisma.token.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false, revokedAt: new Date() },
      }),
    ]);
    if (!u) throw new NotFoundException('Usuário não encontrado.');
    return { success: true, revoked: res.count };
  }

  async remove(id: string) {
    // revoga tokens + deleta user em transação
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

    // troca senha + revoga tokens numa transação
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: await bcrypt.hash(dto.newPassword, 10) },
      }),
      this.prisma.token.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false, revokedAt: new Date() },
      }),
    ]);

    return { success: true };
  }
}
