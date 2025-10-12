import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCartorioDto } from './create-cartorio.dto';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class UpsertGeomDto {
  @ApiPropertyOptional() @IsOptional() @IsInt()
  numg_geolocalizacao?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  delete?: boolean;

  @ApiPropertyOptional({ description: 'GeoJSON' })
  @IsOptional()
  geojson?: any;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  desc_tipo?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt()
  numg_municipio?: number;
}

export class UpdateCartorioDto extends PartialType(CreateCartorioDto) {
  @ApiPropertyOptional({ description: 'Soft delete de todas as geometrias atuais antes de inserir as novas' })
  @IsOptional() @IsBoolean()
  replace_geometrias?: boolean;

  @ApiPropertyOptional({ type: [UpsertGeomDto] })
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => UpsertGeomDto)
  geometrias?: UpsertGeomDto[];
}
