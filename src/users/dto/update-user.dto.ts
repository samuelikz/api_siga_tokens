import { IsEmail, IsEnum, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';

export class UpdateUserAdminDto {
  id!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, {
    message: 'A nova senha deve ter pelo menos 6 caracteres',
  })
  password?: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'USER'], {
    message: 'role deve ser ADMIN ou USER',
  })
  role?: 'ADMIN' | 'USER';

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
