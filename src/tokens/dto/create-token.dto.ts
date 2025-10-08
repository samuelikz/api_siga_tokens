import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { IsISO8601 } from 'class-validator';
import type { TokenScope } from 'src/common/types/enums';
import { TokenScopeEnum } from 'src/common/types/enums';

@ValidatorConstraint({ name: 'IsFutureISODate', async: false })
class IsFutureISODate implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return false;
    const d = new Date(value);
    if (isNaN(d.getTime())) return false;
    return d.getTime() > Date.now();
  }
  defaultMessage() {
    return 'expiresAt deve ser uma data ISO válida no futuro';
  }
}

export class CreateTokenDto {
  /** ADMIN pode definir; USER será ignorado no service se enviar outro id */
  @IsOptional()
  @IsUUID(4, { message: 'userId deve ser um UUID v4' })
  userId?: string;

  /** 'READ' | 'WRITE' | 'READ_WRITE' */
  @IsEnum(TokenScopeEnum, { message: 'scope deve ser READ, WRITE ou READ_WRITE' })
  scope!: TokenScope;

  /** ISO 8601 e obrigatoriamente no futuro */
  @IsISO8601({}, { message: 'expiresAt deve ser uma data em formato ISO 8601' })
  @Validate(IsFutureISODate)
  expiresAt!: string;

  @IsOptional()
  @IsString()
  @Length(0, 255, { message: 'description deve ter no máximo 255 caracteres' })
  description?: string;
}
