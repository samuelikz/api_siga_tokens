// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaPrimaryService } from '../prisma/prisma-primary.service';
import { RoleGuard } from 'src/common/guards/role/role.guard';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaPrimaryService, RoleGuard],
  exports: [UsersService],
})
export class UsersModule {}
