import { IsEmail, IsEnum, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'USER'], {
    message: 'role deve ser ADMIN ou USER',
  })
  role?: 'ADMIN' | 'USER';

  @IsString()
  @MinLength(6, {
    message: 'A senha deve ter pelo menos 6 caracteres',
  })
  password!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean; 
}
