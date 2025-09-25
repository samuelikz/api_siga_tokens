// src/imoveis/imoveis.include.ts
import type { Prisma } from '@db/secondary';

export const IMOVEL_BASE_INCLUDE: Prisma.ad_imovelInclude = {
  ad_municipio: { include: { ad_regiao: { include: { ad_macro_regiao: true } } } },
  ad_destinacao: true,
  ad_finalidade_uso: true,
  ad_cartorio: true,
  ad_documento_ad_imovel_numg_documento_escrituraToad_documento: true,
  ad_documento_ad_imovel_numg_documento_certidaoToad_documento: true,
  ad_imovel_projeto: {
    orderBy: { data_projeto: 'desc' },
    take: 1,
    include: {
      ad_documento_ad_imovel_projeto_numg_documento_projetoToad_documento: true,
      ad_documento_ad_imovel_projeto_numg_documento_certidaoToad_documento: true,
      ad_documento_ad_imovel_projeto_numg_documento_habiteseToad_documento: true,
    },
  },
  ad_imovel_vistoria: {
    orderBy: { data_vistoria: 'desc' },
    take: 1,
    include: { ad_documento: true },
  },
  ad_imovel_laudo: {
    orderBy: { data_laudo: 'desc' },
    take: 1,
    include: { ad_documento: true },
  },
  ad_situacao_regularizacao: true,
};
