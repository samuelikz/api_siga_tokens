import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaSecondaryService } from 'src/prisma/prisma-secondary.service';
import { IMOVEL_BASE_INCLUDE } from './imoveis.include';
import { buildListWhere, type ListQuery } from './imoveis.where';
import { toImovelView } from './imoveis.mapper';
import { CreateImovelDto } from './dto/create-imovel.dto/create-imovel.dto';

const toInt = (v: unknown, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
};

@Injectable()
export class ImoveisService {
  constructor(
    private readonly db: PrismaSecondaryService,
    private readonly config: ConfigService,   // <-- injeta ConfigService
  ) {}

  async list(q: ListQuery & { page?: number; pageSize?: number }) {
    const DEFAULT = toInt(this.config.get('IMOVEIS_PAGE_SIZE_DEFAULT'), 10);
    const MAX     = toInt(this.config.get('IMOVEIS_PAGE_SIZE_MAX'), 100);

    const page     = toInt(q.page, 1);
    const pageSize = Math.min(toInt(q.pageSize ?? DEFAULT, DEFAULT), MAX);
    const skip     = (page - 1) * pageSize;

    const where = buildListWhere(q);

    const [rows, total] = await Promise.all([
      this.db.ad_imovel.findMany({
        where,
        orderBy: { numg_imovel: 'asc' },
        skip,
        take: pageSize,
        include: IMOVEL_BASE_INCLUDE,
      }),
      this.db.ad_imovel.count({ where }),
    ]);

    return {
      meta: { page, pageSize, total },
      items: rows.map(toImovelView),
    };
  }

  async findById(id: string) {
    const r = await this.db.ad_imovel.findUnique({
      where: { numg_imovel: BigInt(id) },
      include: IMOVEL_BASE_INCLUDE,
    });
    if (!r) throw new NotFoundException('Imóvel não encontrado');
    return toImovelView(r as any);
  }

  // idem ao seu create — mantive igual, sem repetição extra
  async create(dto: CreateImovelDto) {
    return this.db.$transaction(async (tx) => {
      const created = await tx.ad_imovel.create({
        data: {
          numg_imovel_origem: dto.imovelOrigem ? BigInt(dto.imovelOrigem) : undefined,
          codg_latitude: dto.latitude,
          codg_longitude: dto.longitude,
          codg_cep: dto.cep,
          desc_logradouro: dto.logradouro,
          desc_bairro: dto.bairro,
          numr_endereco: dto.numero,
          desc_lote: dto.lote,
          desc_quadra: dto.quadra,
          numg_municipio: dto.municipio,

          codg_zoneamento: dto.zoneamento,
          codg_area_interesse: dto.areaInteresse,
          numg_finalidade_uso: dto.finalidadeUso,
          flag_edificado: dto.edificado,
          numr_pavimento: dto.qtdPavimentos,
          codg_estado_imovel: dto.estadoImovel,
          codg_ocupacao: dto.ocupacao,
          desc_parcialmente_ocupado: dto.obsParcialmenteOcupado,
          codg_tipo_imovel: dto.tipoImovel,
          numg_situacao_regularizacao: dto.situacaoRegularizacao,
          numg_destinacao: dto.destinacao,

          numr_area_total: dto.areaTotal ? (dto.areaTotal as any) : undefined,
          numr_area_construida: dto.areaConstruida ? (dto.areaConstruida as any) : undefined,

          codg_registro_cartorio: dto.registroCartorio,
          codg_matricula_imovel: dto.matricula,
          data_registro_imovel: dto.dataRegistro ? new Date(dto.dataRegistro) : undefined,
          numg_cartorio: dto.cartorio,
          nome_proprietario: dto.nomeProprietario,

          numg_documento_escritura: dto.docEscritura?.id ? BigInt(dto.docEscritura.id) : undefined,
          numg_documento_certidao: dto.docCertidao?.id ? BigInt(dto.docCertidao.id) : undefined,

          data_cadastro: new Date(),
          numg_pessoa_cadastro: 1,
        },
      });

      const imovelId = created.numg_imovel;

      if (dto.projeto) {
        await tx.ad_imovel_projeto.create({
          data: {
            numg_imovel: imovelId,
            nome_projeto: dto.projeto.nome,
            codg_identificador_projeto: dto.projeto.identificadorProjeto,
            codg_sequencial_imovel: dto.projeto.sequencialImovel,
            data_projeto: dto.projeto.dataProjeto ? new Date(dto.projeto.dataProjeto) : undefined,
            data_aprovacao: dto.projeto.dataAprovacao ? new Date(dto.projeto.dataAprovacao) : undefined,
            data_validade: dto.projeto.validadeAprovacao ? new Date(dto.projeto.validadeAprovacao) : undefined,
            numr_testada: dto.projeto.testada ? (dto.projeto.testada as any) : undefined,
            numg_documento_projeto: dto.projeto.anexoProjeto?.id ? BigInt(dto.projeto.anexoProjeto.id) : undefined,
            numg_documento_certidao: dto.projeto.anexoCertidao?.id ? BigInt(dto.projeto.anexoCertidao.id) : undefined,
            numg_documento_habitese: dto.projeto.anexoHabitese?.id ? BigInt(dto.projeto.anexoHabitese.id) : undefined,
            data_cadastro: new Date(),
          },
        });
      }

      if (dto.vistoria) {
        await tx.ad_imovel_vistoria.create({
          data: {
            numg_imovel: imovelId,
            nome_resposavel: dto.vistoria.responsavelTecnico,
            data_vistoria: new Date(dto.vistoria.data),
            numg_documento_vistoria: dto.vistoria.anexoVistoria?.id
              ? BigInt(dto.vistoria.anexoVistoria.id)
              : undefined,
            data_cadastro: new Date(),
            numg_pessoa_cadastro: 1,
          },
        });
      }

      if (dto.laudo) {
        await tx.ad_imovel_laudo.create({
          data: {
            numg_imovel: imovelId,
            nome_responsavel: dto.vistoria?.responsavelTecnico ?? '—',
            codg_finalidade: dto.laudo.finalidade,
            data_laudo: new Date(dto.laudo.data),
            numg_documento_laudo: dto.laudo.anexoLaudo?.id ? BigInt(dto.laudo.anexoLaudo.id) : undefined,
            valr_minimo: dto.laudo.valorMinimo ? (dto.laudo.valorMinimo as any) : undefined,
            valr_medio: dto.laudo.valorMedio ? (dto.laudo.valorMedio as any) : undefined,
            valr_maximo: dto.laudo.valorMaximo ? (dto.laudo.valorMaximo as any) : undefined,
            data_cadastro: new Date(),
            numg_pessoa_cadastro: 1,
          },
        });
      }

      return { ok: true, id: String(imovelId) };
    });
  }
}
