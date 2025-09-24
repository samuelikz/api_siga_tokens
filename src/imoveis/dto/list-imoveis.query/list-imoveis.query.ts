import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListImoveisQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize?: number = 20;

  @IsOptional() @IsString() search?: string;

  @IsOptional() @Type(() => Number) @IsInt() numg_municipio?: number;
  @IsOptional() @Type(() => Number) @IsInt() numg_destinacao?: number;
}
// filtros adicionais podem ser adicionados conforme necessário
// ex: @IsOptional() @IsString() cidade?: string;