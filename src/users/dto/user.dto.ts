import { Expose } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength, IsBoolean } from 'class-validator';

// =======================
// DTO de saída (UserDto)
// =======================
export class UserDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  name!: string;

  @Expose()
  role!: 'ADMIN' | 'USER';

  @Expose()
  isActive!: boolean;

  @Expose()
  createdAt!: string;
}

// =======================
// DTOs de entrada
// =======================
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
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  password!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserAdminDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['ADMIN', 'USER'], {
    message: 'role deve ser ADMIN ou USER',
  })
  role?: 'ADMIN' | 'USER';

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateOwnProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateOwnPasswordDto {
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @IsString()
  @MinLength(6)
  newPassword!: string;
}
