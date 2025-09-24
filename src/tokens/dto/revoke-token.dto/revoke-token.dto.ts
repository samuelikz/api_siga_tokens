import { IsString } from 'class-validator';
export class RevokeTokenDto {
  @IsString() id!: string;
}
// id do token a ser revogado