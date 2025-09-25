import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaPrimaryService } from '../prisma/prisma-primary.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user-dto/create-user.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaPrimaryService) { }

  async list(page = 1, pageSize = 20) {
    const take = pageSize;
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip, take,
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return { page, pageSize: take, total, items };
  }

  async create(dto: CreateUserDto) {
    // Verifica e-mail único
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('E-mail já cadastrado.');

    // Hash de senha
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // OBS: ajuste o campo abaixo se no seu schema o nome for diferente (ex.: password, hash, etc.)
    const user = await this.prisma.user.create({
      data: {
        id: randomUUID(),            // mantenha se o schema não tiver default(uuid())
        email: dto.email,
        name: dto.name,
        role: dto.role ?? 'USER',
        password: passwordHash,      
        updatedAt: new Date(),       
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return user;
  }
}
