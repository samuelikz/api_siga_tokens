import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({ require_tld: false }) // em prod você pode trocar pra true
  email!: string;

  @IsString()
  @MinLength(3)
  password!: string;
}
