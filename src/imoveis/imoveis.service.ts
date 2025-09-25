import { Injectable } from '@nestjs/common';
import { PrismaSecondaryService } from '../prisma/prisma-secondary.service';
import { ListImoveisQuery } from './dto/list-imoveis.query/list-imoveis.query';

@Injectable()
export class ImoveisService {
  constructor(private readonly db: PrismaSecondaryService) {}

  async list(q: ListImoveisQuery) {
    const page = q.page ?? 1;
    const take = q.pageSize ?? 20;
    const skip = (page - 1) * take;

    const where: any = {};
    if (q.numg_municipio) where.numg_municipio = q.numg_municipio;
    if (q.numg_destinacao) where.numg_destinacao = q.numg_destinacao;
    if (q.search?.trim()) {
      const s = q.search.trim();
      where.OR = [
        { nome_proprietario: { contains: s, mode: 'insensitive' } },
        { desc_logradouro:  { contains: s, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.db.ad_imovel.findMany({ where, skip, take }), 
      this.db.ad_imovel.count({ where }),
    ]);

    return { page, pageSize: take, total, items };
  }
}
