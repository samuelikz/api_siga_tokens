import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: '8e4761ed-0214-4df9-b131-0f6607fa46f7' }) id!: string;
  @ApiProperty({ example: 'admin@local.com' }) email!: string;
  @ApiProperty({ example: 'Admin' }) name!: string;
  @ApiProperty({ example: 'ADMIN', enum: ['ADMIN','USER'] }) role!: 'ADMIN' | 'USER';
  @ApiProperty({ example: '2025-09-24T12:34:56.000Z' }) createdAt!: string;
}
