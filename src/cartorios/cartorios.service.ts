import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import paginationConfig from 'src/config/pagination.config';
import { PrismaSecondaryService } from '../prisma/prisma-secondary.service';
// tipos de prisma como type-only
import type { Prisma as PrismaSecondary } from '@db/secondary';

type CartorioAggRow = {
  numg_cartorio: number;
  nome_cartorio: string | null;
  desc_cartorio: string | null;
  numg_municipio: number;
  centroid_geojson: string | null;
  bbox_geojson: string | null;
};

@Injectable()
export class CartoriosService {
  constructor(
    private prisma: PrismaSecondaryService,
    @Inject(paginationConfig.KEY)
    private readonly pconf: ConfigType<typeof paginationConfig>,
  ) {}

  // ------- helpers -------
  private selectBase(opts?: { includeMunicipio?: boolean; withCounts?: boolean }) {
    const { includeMunicipio = false, withCounts = false } = opts ?? {};
    const select: PrismaSecondary.ad_cartorioSelect = {
      numg_cartorio: true,
      nome_cartorio: true,
      desc_cartorio: true,
      numg_municipio: true,
      ...(includeMunicipio && {
        ad_municipio: { select: { numg_municipio: true, nome_municipio: true } },
      }),
      ...(withCounts && { _count: { select: { ad_geolocalizacao: true, ad_imovel: true } } }),
    };
    return select;
  }

  private buildWhere(search?: string, numg_municipio?: number) {
    const filters: string[] = [];
    const values: unknown[] = [];
    let i = 1;
    if (search?.trim()) {
      filters.push(`(c.nome_cartorio ILIKE $${i} OR c.desc_cartorio ILIKE $${i})`);
      values.push(`%${search}%`); i++;
    }
    if (typeof numg_municipio === 'number') {
      filters.push(`c.numg_municipio = $${i}`);
      values.push(numg_municipio); i++;
    }
    return { whereSql: filters.length ? `WHERE ${filters.join(' AND ')}` : '', values, nextIdx: i };
  }

  private mapAgg(r: CartorioAggRow) {
    return {
      numg_cartorio: r.numg_cartorio,
      nome_cartorio: r.nome_cartorio,
      desc_cartorio: r.desc_cartorio,
      numg_municipio: r.numg_municipio,
      centroid: r.centroid_geojson ? JSON.parse(r.centroid_geojson) : null,
      bbox: r.bbox_geojson ? JSON.parse(r.bbox_geojson) : null,
    };
  }

  // ------- list (retorno cru p/ interceptor) -------
  async list(params: {
    page: number; pageSize: number; offset: number; limit: number;
    search?: string; numg_municipio?: number;
  }) {
    const { page, pageSize, offset, search, numg_municipio } = params;
    const { whereSql, values, nextIdx } = this.buildWhere(search, numg_municipio);

    const totalRows = (await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::text AS count FROM ad_cartorio c ${whereSql};`,
      ...values,
    )) as { count: string }[];
    const total = Number(totalRows[0]?.count ?? 0);

    const rows = (await this.prisma.$queryRawUnsafe(
      `
      SELECT
        c.numg_cartorio,
        c.nome_cartorio,
        c.desc_cartorio,
        c.numg_municipio,
        ST_AsGeoJSON(ST_Centroid(ST_Collect(g.desc_geometria))) AS centroid_geojson,
        ST_AsGeoJSON(ST_Envelope(ST_Collect(g.desc_geometria)))  AS bbox_geojson
      FROM ad_cartorio c
      LEFT JOIN ad_geolocalizacao g
        ON g.numg_cartorio = c.numg_cartorio
       AND g.data_exclusao IS NULL
      ${whereSql}
      GROUP BY c.numg_cartorio, c.nome_cartorio, c.desc_cartorio, c.numg_municipio
      ORDER BY c.numg_cartorio ASC
      OFFSET $${nextIdx} LIMIT $${nextIdx + 1};
      `,
      ...values, offset, pageSize,
    )) as CartorioAggRow[];

    return { data: rows.map(this.mapAgg), total, page, pageSize };
  }

  // ------- item -------
  async findOneWithGeometries(id: number) {
    const rows = (await this.prisma.$queryRawUnsafe(
      `
      SELECT
        c.numg_cartorio,
        c.nome_cartorio,
        c.desc_cartorio,
        c.numg_municipio,
        ST_AsGeoJSON(ST_Centroid(ST_Collect(g.desc_geometria))) AS centroid_geojson,
        ST_AsGeoJSON(ST_Envelope(ST_Collect(g.desc_geometria)))  AS bbox_geojson
      FROM ad_cartorio c
      LEFT JOIN ad_geolocalizacao g
        ON g.numg_cartorio = c.numg_cartorio
       AND g.data_exclusao IS NULL
      WHERE c.numg_cartorio = $1
      GROUP BY c.numg_cartorio, c.nome_cartorio, c.desc_cartorio, c.numg_municipio;
      `,
      id,
    )) as CartorioAggRow[];

    if (!rows.length) throw new NotFoundException('Cartório não encontrado');
    return this.mapAgg(rows[0]);
  }

  // ------- CRUD + geometrias -------
  create(data: PrismaSecondary.ad_cartorioCreateInput) {
    return this.prisma.ad_cartorio.create({ data, select: this.selectBase() });
  }

  async update(id: number, data: PrismaSecondary.ad_cartorioUpdateInput & {
    replace_geometrias?: boolean;
    geometrias?: Array<{
      numg_geolocalizacao?: number;
      delete?: boolean;
      geojson?: any;
      desc_tipo?: string;
      numg_municipio?: number;
    }>;
  }) {
    const exists = await this.prisma.ad_cartorio.findUnique({
      where: { numg_cartorio: id }, select: { numg_cartorio: true },
    });
    if (!exists) throw new NotFoundException('Cartório não encontrado');

    const { replace_geometrias, geometrias, ...cartorioData } = data as any;

    return this.prisma.$transaction(async (tx) => {
      if ('nome_cartorio' in cartorioData || 'desc_cartorio' in cartorioData || 'ad_municipio' in cartorioData) {
        await tx.ad_cartorio.update({ where: { numg_cartorio: id }, data: cartorioData, select: { numg_cartorio: true } });
      }

      if (Array.isArray(geometrias) && geometrias.length) {
        if (replace_geometrias) {
          await tx.$executeRawUnsafe(
            `UPDATE ad_geolocalizacao SET data_exclusao = NOW() WHERE numg_cartorio = $1 AND data_exclusao IS NULL;`,
            id,
          );
        }
        for (const g of geometrias) {
          if (g.delete && g.numg_geolocalizacao) {
            await tx.$executeRawUnsafe(
              `UPDATE ad_geolocalizacao SET data_exclusao = NOW()
               WHERE numg_geolocalizacao = $1 AND numg_cartorio = $2 AND data_exclusao IS NULL;`,
              g.numg_geolocalizacao, id,
            );
            continue;
          }
          if (g.numg_geolocalizacao && g.geojson) {
            const geojsonStr = JSON.stringify(g.geojson);
            await tx.$executeRawUnsafe(
              `
              UPDATE ad_geolocalizacao
                 SET desc_geometria = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
                     desc_tipo      = $2,
                     numg_municipio = COALESCE($3, numg_municipio),
                     calculated_area = ST_Area(
                       ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), 3857)
                     ),
                     data_exclusao  = NULL
               WHERE numg_geolocalizacao = $4 AND numg_cartorio = $5;
              `,
              geojsonStr, g.desc_tipo ?? null, g.numg_municipio ?? null, g.numg_geolocalizacao, id,
            );
          } else if (!g.numg_geolocalizacao && g.geojson) {
            const geojsonStr = JSON.stringify(g.geojson);
            await tx.$executeRawUnsafe(
              `
              INSERT INTO ad_geolocalizacao
                (numg_imovel, desc_tipo, desc_geometria, calculated_area,
                 numg_regiao, numg_macro_regiao, numg_cartorio, numg_municipio)
              VALUES
                (NULL, $1, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326),
                 ST_Area(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($2), 4326), 3857)),
                 NULL, NULL, $3, $4);
              `,
              g.desc_tipo ?? null, geojsonStr, id, g.numg_municipio ?? null,
            );
          }
        }
      }

      return this.findOneWithGeometries(id);
    });
  }

  async delete(id: number) {
    const exists = await this.prisma.ad_cartorio.findUnique({
      where: { numg_cartorio: id }, select: { numg_cartorio: true },
    });
    if (!exists) throw new NotFoundException('Cartório não encontrado');

    await this.prisma.ad_cartorio.delete({ where: { numg_cartorio: id } });
    return { ok: true };
  }
}
