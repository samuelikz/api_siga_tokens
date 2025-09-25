import { IsString } from 'class-validator';

export class RevokeTokenDto {
  @IsString()
  tokenId!: string;
}
