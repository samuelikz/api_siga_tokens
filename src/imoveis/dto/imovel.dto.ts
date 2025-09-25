import { ApiProperty } from '@nestjs/swagger';

export class ImovelDto {
  @ApiProperty({ example: '1234567890', description: 'Identificador (bigint como string)' })
  numg_imovel!: string; // lembre: BigIntInterceptor -> string

  @ApiProperty({ example: 'Rua Exemplo, 123' })
  desc_logradouro!: string;

  @ApiProperty({ example: 'Fulano de Tal' })
  nome_proprietario!: string;

  @ApiProperty({ example: 3550308, description: 'Código do município (IBGE, se aplicável)' })
  numg_municipio!: number;

  @ApiProperty({ example: 7, nullable: true })
  numg_destinacao?: number | null;

  // ...adicione os campos que você quer expor
}
