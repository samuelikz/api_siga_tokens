import { Injectable } from '@nestjs/common';
import { PrismaPrimaryService } from '../prisma/prisma-primary.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaPrimaryService) {}

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
}
