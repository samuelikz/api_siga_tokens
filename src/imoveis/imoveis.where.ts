// src/imoveis/imoveis.where.ts
import type { Prisma } from '@db/secondary';

export type ListQuery = {
  search?: string;
  numg_municipio?: number;
  numg_destinacao?: number;
};

export function buildListWhere(q: ListQuery): Prisma.ad_imovelWhereInput {
  const where: Prisma.ad_imovelWhereInput = {};

  if (q.search?.trim()) {
    where.OR = [
      { nome_proprietario: { contains: q.search, mode: 'insensitive' } },
      { desc_logradouro:  { contains: q.search, mode: 'insensitive' } },
    ];
  }
  if (q.numg_municipio) where.numg_municipio = q.numg_municipio;
  if (q.numg_destinacao) where.numg_destinacao = q.numg_destinacao;

  return where;
}
