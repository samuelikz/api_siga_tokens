// src/users/dto/user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Expose } from 'class-transformer';               // <— ADICIONE
import { Role } from '../user.types';

export class UserDto {
  @Expose()                                              // <— ADICIONE
  @ApiProperty({ example: '8e4761ed-0214-4df9-b131-0f6607fa46f7' }) id!: string;

  @Expose()                                              // <— ADICIONE
  @ApiProperty({ example: 'admin@local.com' }) email!: string;

  @Expose()                                              // <— ADICIONE
  @ApiProperty({ example: 'Admin' }) name!: string;

  @Expose()                                              // <— ADICIONE
  @ApiProperty({ enum: Role, example: Role.ADMIN }) role!: Role;

  @Expose()                                              // <— ADICIONE
  @ApiProperty({ example: '2025-09-24T12:34:56.000Z' }) createdAt!: string;
  
}

// (demais DTOs de entrada podem ficar como estão)
export class CreateUserDto {
  @IsEmail() email!: string;
  @IsString() name!: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsString() @MinLength(6) password!: string;
}

export class UpdateUserAdminDto {
  @IsUUID() id!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsString() @MinLength(6) password?: string;
}

export class UpdateOwnProfileDto {
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() name?: string;
}

export class UpdateOwnPasswordDto {
  @IsString() @MinLength(6) currentPassword!: string;
  @IsString() @MinLength(6) newPassword!: string;
}
