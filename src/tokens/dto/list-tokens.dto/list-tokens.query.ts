import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListTokensQuery {
  @ApiPropertyOptional({ enum: ['both', 'owner', 'creator'], default: 'both' })
  @IsOptional()
  @IsIn(['both', 'owner', 'creator'])
  type: 'both' | 'owner' | 'creator' = 'both';

  @ApiPropertyOptional({ example: 1, default: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}
