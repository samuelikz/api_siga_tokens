// src/tokens/dto/list-all-tokens.query.ts
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListAllTokensQuery {
  @IsOptional()
  @IsEnum(['active', 'revoked', 'expired'] as const)
  status?: 'active' | 'revoked' | 'expired';

  @IsOptional()
  @IsEnum(['READ', 'WRITE', 'READ_WRITE'] as const)
  scope?: 'READ' | 'WRITE' | 'READ_WRITE';

  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @IsOptional()
  @IsUUID()
  creatorId?: string;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
