import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail() email!: string;
  @IsString() name!: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'USER'] as const)
  role?: 'ADMIN' | 'USER';

  @IsString()
  @MinLength(6)
  password!: string;
}
