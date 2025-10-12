import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCartorioDto {
  @ApiProperty({ required: false, maxLength: 256 })
  @IsOptional() @IsString() @MaxLength(256)
  nome_cartorio?: string;

  @ApiProperty({ required: false, maxLength: 1000 })
  @IsOptional() @IsString() @MaxLength(1000)
  desc_cartorio?: string;

  @ApiProperty({ description: 'FK para ad_municipio.numg_municipio' })
  @IsInt() @IsNotEmpty()
  numg_municipio!: number;
}
