import { ApiProperty } from '@nestjs/swagger';

export class ImovelViewDto {
  // Básico do imóvel
  @ApiProperty() id!: string; // numg_imovel (BigInt -> string via interceptor)
  @ApiProperty({ nullable: true }) imovelOrigem?: string | null; // numg_imovel_origem
  @ApiProperty() ativo!: boolean;
  @ApiProperty({ nullable: true }) coordenadas?: { latitude?: string|null; longitude?: string|null } | null;
  @ApiProperty({ nullable: true }) cep?: string | null;
  @ApiProperty({ nullable: true }) logradouro?: string | null;
  @ApiProperty({ nullable: true }) bairro?: string | null;
  @ApiProperty({ nullable: true }) numero?: number | null;
  @ApiProperty({ nullable: true }) lote?: string | null;
  @ApiProperty({ nullable: true }) quadra?: string | null;

  // Ligações territoriais
  @ApiProperty({ nullable: true }) municipio?: string | null;          // ad_municipio.nome_municipio
  @ApiProperty({ nullable: true }) regiaoDesenvolvimento?: string | null; // ad_regiao.nome_regiao
  @ApiProperty({ nullable: true }) macroRegiao?: string | null;        // ad_macro_regiao.nome_macro_regiao

  // Cadastros e classificações
  @ApiProperty({ nullable: true }) destinacao?: string | null;         // ad_destinacao.nome_destinacao
  @ApiProperty({ nullable: true }) zoneamento?: string | null;         // codg_zoneamento
  @ApiProperty({ nullable: true }) areaInteresse?: string | null;      // codg_area_interesse
  @ApiProperty({ nullable: true }) finalidadeUso?: string | null;      // ad_finalidade_uso.nome_finalidade_uso
  @ApiProperty({ nullable: true }) edificado?: boolean | null;
  @ApiProperty({ nullable: true }) qtdPavimentos?: number | null;
  @ApiProperty({ nullable: true }) estadoImovel?: string | null;       // codg_estado_imovel
  @ApiProperty({ nullable: true }) ocupacao?: string | null;           // codg_ocupacao
  @ApiProperty({ nullable: true }) obsParcialmenteOcupado?: string | null;
  @ApiProperty({ nullable: true }) tipoImovel?: string | null;         // codg_tipo_imovel
  @ApiProperty({ nullable: true }) situacaoRegularizacao?: string | null; // ad_situacao_regularizacao.nome_situacao_regularizacao

  // Áreas
  @ApiProperty({ nullable: true }) areaTotal?: string | null;          // Decimal -> string
  @ApiProperty({ nullable: true }) areaConstruida?: string | null;     // Decimal -> string

  // Registro/cartório
  @ApiProperty({ nullable: true }) registroCartorio?: string | null;   // codg_registro_cartorio
  @ApiProperty({ nullable: true }) matricula?: string | null;          // codg_matricula_imovel
  @ApiProperty({ nullable: true }) dataRegistro?: string | null;       // data_registro_imovel
  @ApiProperty({ nullable: true }) cartorio?: string | null;           // ad_cartorio.nome_cartorio
  @ApiProperty({ nullable: true }) nomeProprietario?: string | null;

  // Documentos (IDs/nomes se houver)
  @ApiProperty({ nullable: true }) docEscritura?: { id?: string; nome?: string } | null;
  @ApiProperty({ nullable: true }) docCertidao?: { id?: string; nome?: string } | null;

  // Projeto (pega o mais recente)
  @ApiProperty({ nullable: true }) nomeProjeto?: string | null;
  @ApiProperty({ nullable: true }) testada?: string | null; // Decimal -> string
  @ApiProperty({ nullable: true }) dataProjeto?: string | null;
  @ApiProperty({ nullable: true }) dataAprovacao?: string | null;
  @ApiProperty({ nullable: true }) validadeAprovacao?: string | null;
  @ApiProperty({ nullable: true }) sequencialImovel?: string | null;
  @ApiProperty({ nullable: true }) identificadorProjeto?: string | null;
  @ApiProperty({ nullable: true }) anexoProjeto?: { id?: string; nome?: string } | null;
  @ApiProperty({ nullable: true }) anexoCertidao?: { id?: string; nome?: string } | null;
  @ApiProperty({ nullable: true }) anexoHabitese?: { id?: string; nome?: string } | null;

  // Vistoria (mais recente)
  @ApiProperty({ nullable: true }) dataVistoria?: string | null;
  @ApiProperty({ nullable: true }) responsavelTecnicoVistoria?: string | null;
  @ApiProperty({ nullable: true }) anexoVistoria?: { id?: string; nome?: string } | null;

  // Laudo (mais recente)
  @ApiProperty({ nullable: true }) finalidade?: string | null; // codg_finalidade
  @ApiProperty({ nullable: true }) dataLaudo?: string | null;
  @ApiProperty({ nullable: true }) valorMinimo?: string | null; // Decimal -> string
  @ApiProperty({ nullable: true }) valorMedio?: string | null;
  @ApiProperty({ nullable: true }) valorMaximo?: string | null;
  @ApiProperty({ nullable: true }) anexoLaudo?: { id?: string; nome?: string } | null;
}
// campos adicionais podem ser adicionados conforme necessário