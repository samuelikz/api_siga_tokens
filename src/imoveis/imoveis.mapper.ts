// src/imoveis/imoveis.mapper.ts
import type { ad_imovel } from '@db/secondary';
import { ImovelViewDto } from './dto/imovel-view.dto.ts/imovel-view.dto';

// tipo do findMany/findUnique com include aplicado
type ImovelWithAll = ad_imovel & {
  ad_municipio?: {
    nome_municipio: string;
    ad_regiao?: { nome_regiao: string; ad_macro_regiao?: { nome_macro_regiao: string } | null } | null;
  } | null;
  ad_destinacao?: { nome_destinacao: string } | null;
  ad_finalidade_uso?: { nome_finalidade_uso: string } | null;
  ad_cartorio?: { nome_cartorio: string } | null;
  ad_documento_ad_imovel_numg_documento_escrituraToad_documento?: { numg_documento: bigint; nome_documento: string } | null;
  ad_documento_ad_imovel_numg_documento_certidaoToad_documento?:  { numg_documento: bigint; nome_documento: string } | null;
  ad_imovel_projeto: Array<{
    nome_projeto: string | null;
    numr_testada: any | null;
    data_projeto: Date | null;
    data_aprovacao: Date | null;
    data_validade: Date | null;
    codg_sequencial_imovel: string | null;
    codg_identificador_projeto: string | null;
    ad_documento_ad_imovel_projeto_numg_documento_projetoToad_documento?: { numg_documento: bigint; nome_documento: string } | null;
    ad_documento_ad_imovel_projeto_numg_documento_certidaoToad_documento?: { numg_documento: bigint; nome_documento: string } | null;
    ad_documento_ad_imovel_projeto_numg_documento_habiteseToad_documento?: { numg_documento: bigint; nome_documento: string } | null;
  }>;
  ad_imovel_vistoria: Array<{
    data_vistoria: Date;
    nome_resposavel: string | null;
    ad_documento?: { numg_documento: bigint; nome_documento: string } | null;
  }>;
  ad_imovel_laudo: Array<{
    codg_finalidade: string | null;
    data_laudo: Date;
    valr_minimo: any | null;
    valr_medio: any | null;
    valr_maximo: any | null;
    ad_documento?: { numg_documento: bigint; nome_documento: string } | null;
  }>;
  ad_situacao_regularizacao?: { nome_situacao_regularizacao: string | null } | null;
};

export function toImovelView(r: ImovelWithAll): ImovelViewDto {
  const proj = r.ad_imovel_projeto?.[0];
  const vist = r.ad_imovel_vistoria?.[0];
  const laud = r.ad_imovel_laudo?.[0];

  return {
    id: String(r.numg_imovel),
    imovelOrigem: r.numg_imovel_origem ? String(r.numg_imovel_origem) : null,
    ativo: !r.data_exclusao,
    coordenadas: { latitude: r.codg_latitude ?? null, longitude: r.codg_longitude ?? null },
    cep: r.codg_cep ?? null,
    logradouro: r.desc_logradouro ?? null,
    bairro: r.desc_bairro ?? null,
    numero: r.numr_endereco ?? null,
    lote: r.desc_lote ?? null,
    quadra: r.desc_quadra ?? null,

    municipio: r.ad_municipio?.nome_municipio ?? null,
    regiaoDesenvolvimento: r.ad_municipio?.ad_regiao?.nome_regiao ?? null,
    macroRegiao: r.ad_municipio?.ad_regiao?.ad_macro_regiao?.nome_macro_regiao ?? null,

    destinacao: r.ad_destinacao?.nome_destinacao ?? null,
    zoneamento: r.codg_zoneamento ?? null,
    areaInteresse: r.codg_area_interesse ?? null,
    finalidadeUso: r.ad_finalidade_uso?.nome_finalidade_uso ?? null,
    edificado: r.flag_edificado ?? null,
    qtdPavimentos: r.numr_pavimento ?? null,
    estadoImovel: r.codg_estado_imovel ?? null,
    ocupacao: r.codg_ocupacao ?? null,
    obsParcialmenteOcupado: r.desc_parcialmente_ocupado ?? null,
    tipoImovel: r.codg_tipo_imovel ?? null,
    situacaoRegularizacao: r.ad_situacao_regularizacao?.nome_situacao_regularizacao ?? null,

    areaTotal: r.numr_area_total ? String(r.numr_area_total) : null,
    areaConstruida: r.numr_area_construida ? String(r.numr_area_construida) : null,

    registroCartorio: r.codg_registro_cartorio ?? null,
    matricula: r.codg_matricula_imovel ?? null,
    dataRegistro: r.data_registro_imovel ? r.data_registro_imovel.toISOString() : null,
    cartorio: r.ad_cartorio?.nome_cartorio ?? null,
    nomeProprietario: r.nome_proprietario ?? null,

    docEscritura: r.ad_documento_ad_imovel_numg_documento_escrituraToad_documento
      ? {
          id: String(r.ad_documento_ad_imovel_numg_documento_escrituraToad_documento.numg_documento),
          nome: r.ad_documento_ad_imovel_numg_documento_escrituraToad_documento.nome_documento,
        }
      : null,
    docCertidao: r.ad_documento_ad_imovel_numg_documento_certidaoToad_documento
      ? {
          id: String(r.ad_documento_ad_imovel_numg_documento_certidaoToad_documento.numg_documento),
          nome: r.ad_documento_ad_imovel_numg_documento_certidaoToad_documento.nome_documento,
        }
      : null,

    nomeProjeto: proj?.nome_projeto ?? null,
    testada: proj?.numr_testada ? String(proj.numr_testada) : null,
    dataProjeto: proj?.data_projeto ? proj.data_projeto.toISOString() : null,
    dataAprovacao: proj?.data_aprovacao ? proj.data_aprovacao.toISOString() : null,
    validadeAprovacao: proj?.data_validade ? proj.data_validade.toISOString() : null,
    sequencialImovel: proj?.codg_sequencial_imovel ?? null,
    identificadorProjeto: proj?.codg_identificador_projeto ?? null,
    anexoProjeto: proj?.ad_documento_ad_imovel_projeto_numg_documento_projetoToad_documento
      ? {
          id: String(proj.ad_documento_ad_imovel_projeto_numg_documento_projetoToad_documento.numg_documento),
          nome: proj.ad_documento_ad_imovel_projeto_numg_documento_projetoToad_documento.nome_documento,
        }
      : null,
    anexoCertidao: proj?.ad_documento_ad_imovel_projeto_numg_documento_certidaoToad_documento
      ? {
          id: String(proj.ad_documento_ad_imovel_projeto_numg_documento_certidaoToad_documento.numg_documento),
          nome: proj.ad_documento_ad_imovel_projeto_numg_documento_certidaoToad_documento.nome_documento,
        }
      : null,
    anexoHabitese: proj?.ad_documento_ad_imovel_projeto_numg_documento_habiteseToad_documento
      ? {
          id: String(proj.ad_documento_ad_imovel_projeto_numg_documento_habiteseToad_documento.numg_documento),
          nome: proj.ad_documento_ad_imovel_projeto_numg_documento_habiteseToad_documento.nome_documento,
        }
      : null,

    dataVistoria: vist?.data_vistoria ? vist.data_vistoria.toISOString() : null,
    responsavelTecnicoVistoria: vist?.nome_resposavel ?? null,
    anexoVistoria: vist?.ad_documento
      ? { id: String(vist.ad_documento.numg_documento), nome: vist.ad_documento.nome_documento }
      : null,

    finalidade: laud?.codg_finalidade ?? null,
    dataLaudo: laud?.data_laudo ? laud.data_laudo.toISOString() : null,
    valorMinimo: laud?.valr_minimo ? String(laud.valr_minimo) : null,
    valorMedio: laud?.valr_medio ? String(laud.valr_medio) : null,
    valorMaximo: laud?.valr_maximo ? String(laud.valr_maximo) : null,
    anexoLaudo: laud?.ad_documento
      ? { id: String(laud.ad_documento.numg_documento), nome: laud.ad_documento.nome_documento }
      : null,
  };
}
