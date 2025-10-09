// src/tokens/dto/create-token.dto.ts (mensagens curtas e diretas)
import { IsEnum, IsOptional, IsString, IsUUID, Length, Validate, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { IsISO8601 } from 'class-validator';
import type { TokenScope } from 'src/common/types/enums';
import { TokenScopeEnum } from 'src/common/types/enums';

@ValidatorConstraint({ name: 'IsFutureISODate', async: false })
class IsFutureISODate implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    const d = new Date(value);
    return !!value && !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
  }
  defaultMessage() { return 'expiresAt deve ser uma data ISO válida no futuro'; }
}

export class CreateTokenDto {
  @IsOptional()
  @IsUUID(4, { message: 'userId deve ser UUID válido' })
  userId?: string;

  @IsEnum(TokenScopeEnum, { message: 'scope deve ser READ, WRITE ou READ_WRITE' })
  scope!: TokenScope;

  @IsISO8601({}, { message: 'expiresAt deve ser ISO 8601' })
  @Validate(IsFutureISODate)
  expiresAt!: string;

  @IsOptional()
  @IsString()
  @Length(0, 255, { message: 'description deve ter no máximo 255 caracteres' })
  description?: string;
}
