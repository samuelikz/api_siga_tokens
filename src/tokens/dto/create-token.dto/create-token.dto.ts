import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import type { TokenScope } from 'src/common/types/enums';
import { TokenScopeEnum } from 'src/common/types/enums';

export class CreateTokenDto {
  @IsOptional() @IsString() userId?: string;  // ADMIN pode definir; USER ignora
  @IsEnum(TokenScopeEnum) scope!: TokenScope; // 'READ' | 'WRITE' | 'READ_WRITE'
  @IsDateString() expiresAt!: string;
  @IsOptional() @IsString() description?: string;
}