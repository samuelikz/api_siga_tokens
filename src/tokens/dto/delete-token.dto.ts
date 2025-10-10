import { IsOptional, IsUUID } from 'class-validator';

export class DeleteTokenDto {
  /** tokenId do token a revogar/deletar (opcional se vier via header) */
  @IsOptional()
  @IsUUID(4, { message: 'tokenId deve ser um UUID v4' })
  tokenId?: string;
}
