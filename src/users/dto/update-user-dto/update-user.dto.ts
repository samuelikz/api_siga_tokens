import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsUUID() id!: string;

  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() name?: string;

  @IsOptional() @IsEnum(['ADMIN', 'USER'] as const)
  role?: 'ADMIN' | 'USER';

  @IsOptional() @IsString() @MinLength(6)
  password?: string;
}
