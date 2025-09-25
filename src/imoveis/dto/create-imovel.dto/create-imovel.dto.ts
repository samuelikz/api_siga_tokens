import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, ValidateNested,
} from 'class-validator';

// Documentos referenciados por ID já existentes (se você cadastra docs em outra rota)
class DocRef {
  @IsString() id!: string; // numg_documento (BigInt como string)
}

class ProjetoInput {
  @IsString() nome!: string;
  @IsOptional() @IsString() identificadorProjeto?: string;
  @IsOptional() @IsString() sequencialImovel?: string;
  @IsOptional() @IsDateString() dataProjeto?: string;
  @IsOptional() @IsDateString() dataAprovacao?: string;
  @IsOptional() @IsDateString() validadeAprovacao?: string;
  @IsOptional() @IsString() testada?: string; // decimal como string
  @IsOptional() @ValidateNested() @Type(() => DocRef) anexoProjeto?: DocRef;
  @IsOptional() @ValidateNested() @Type(() => DocRef) anexoCertidao?: DocRef;
  @IsOptional() @ValidateNested() @Type(() => DocRef) anexoHabitese?: DocRef;
}

class VistoriaInput {
  @IsString() responsavelTecnico!: string;
  @IsDateString() data!: string;
  @IsOptional() @ValidateNested() @Type(() => DocRef) anexoVistoria?: DocRef;
}

class LaudoInput {
  @IsString() finalidade!: string; // char(1)
  @IsDateString() data!: string;
  @IsOptional() @IsString() valorMinimo?: string; // dec str
  @IsOptional() @IsString() valorMedio?: string;
  @IsOptional() @IsString() valorMaximo?: string;
  @IsOptional() @ValidateNested() @Type(() => DocRef) anexoLaudo?: DocRef;
}

export class CreateImovelDto {
  // Básico
  @IsOptional() @IsString() imovelOrigem?: string; // BigInt str
  @IsOptional() @IsString() latitude?: string;
  @IsOptional() @IsString() longitude?: string;
  @IsOptional() @IsString() cep?: string;
  @IsOptional() @IsString() logradouro?: string;
  @IsOptional() @IsString() bairro?: string;
  @IsOptional() @IsInt() @Type(() => Number) numero?: number;
  @IsOptional() @IsString() lote?: string;
  @IsOptional() @IsString() quadra?: string;
  @IsOptional() @IsInt() @Type(() => Number) municipio?: number;

  // Classificações
  @IsOptional() @IsString() zoneamento?: string;
  @IsOptional() @IsString() areaInteresse?: string;
  @IsOptional() @IsInt() @Type(() => Number) finalidadeUso?: number;
  @IsOptional() @IsBoolean() @Type(() => Boolean) edificado?: boolean;
  @IsOptional() @IsInt() @Type(() => Number) qtdPavimentos?: number;
  @IsOptional() @IsString() estadoImovel?: string;
  @IsOptional() @IsString() ocupacao?: string;
  @IsOptional() @IsString() obsParcialmenteOcupado?: string;
  @IsOptional() @IsString() tipoImovel?: string;
  @IsOptional() @IsInt() @Type(() => Number) situacaoRegularizacao?: number;
  @IsOptional() @IsInt() @Type(() => Number) destinacao?: number;

  // Áreas (decimais como string)
  @IsOptional() @IsString() areaTotal?: string;
  @IsOptional() @IsString() areaConstruida?: string;

  // Cartório/registro
  @IsOptional() @IsString() registroCartorio?: string;
  @IsOptional() @IsString() matricula?: string;
  @IsOptional() @IsDateString() dataRegistro?: string;
  @IsOptional() @IsInt() @Type(() => Number) cartorio?: number;
  @IsOptional() @IsString() nomeProprietario?: string;
  @IsOptional() @ValidateNested() @Type(() => DocRef) docEscritura?: DocRef;
  @IsOptional() @ValidateNested() @Type(() => DocRef) docCertidao?: DocRef;

  // Relacionados (criar 1 registro “mais recente” de cada, se vier)
  @IsOptional() @ValidateNested() @Type(() => ProjetoInput) projeto?: ProjetoInput;
  @IsOptional() @ValidateNested() @Type(() => VistoriaInput) vistoria?: VistoriaInput;
  @IsOptional() @ValidateNested() @Type(() => LaudoInput) laudo?: LaudoInput;
}
