import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { Prisma } from '@db/primary';
type TokenScope = Prisma.$Enums.TokenScope;

export class CreateTokenDto {
  @IsOptional() @IsString() userId?: string;           // ADMIN pode definir; USER ignora
  @IsEnum({ READ:'READ', WRITE:'WRITE', ADMIN:'ADMIN' }) scope!: TokenScope;
  @IsDateString() expiresAt!: string;                   // ISO
  @IsOptional() @IsString() description?: string;
}
// export class CreateTokenDto {}