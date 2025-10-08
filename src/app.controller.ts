// src/users/users.controller.ts
import {
  Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { UsersService } from './users/users.service';
import { PaginationQuery } from './users/dto/pagination.query';
import { CreateUserDto, UpdateOwnPasswordDto, UpdateOwnProfileDto, UpdateUserAdminDto, UserDto } from './users/dto/user.dto';
import { CurrentUser } from './common/decorations/current-user.decorator';
import { Role } from './users/user.types';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('users')
@ApiBearerAuth('bearer')
export class UsersController {
  constructor(private users: UsersService) {}

  // ======= ADMIN =======

  /** Listar usuários (ADMIN) */
  @Get()
  @ApiOkResponse({ type: UserDto, isArray: false })
  async list(@Query() q: PaginationQuery, @CurrentUser() u: { role: Role }) {
    if (u.role !== Role.ADMIN) throw new ForbiddenException();
    return this.users.list(q.page, q.pageSize);
  }

  /** Obter um usuário (ADMIN) */
  @Get(':id')
  @ApiOkResponse({ type: UserDto })
  async getOne(@Param('id') id: string, @CurrentUser() u: { role: Role }) {
    if (u.role !== Role.ADMIN) throw new ForbiddenException();
    return this.users.getOne(id);
  }

  /** Criar usuário (ADMIN) */
  @Post()
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({ type: UserDto })
  async create(@Body() dto: CreateUserDto, @CurrentUser() u: { role: Role }) {
    if (u.role !== Role.ADMIN) throw new ForbiddenException('Apenas ADMIN pode criar usuários.');
    return this.users.create(dto);
  }

  /** Atualizar usuário (ADMIN) - pode mudar role, email, nome e senha */
  @Patch(':id')
  @ApiBody({ type: UpdateUserAdminDto })
  @ApiOkResponse({ type: UserDto })
  async updateAdmin(
    @Param('id') id: string,
    @Body() dto: Omit<UpdateUserAdminDto, 'id'>,
    @CurrentUser() u: { role: Role },
  ) {
    if (u.role !== Role.ADMIN) throw new ForbiddenException();
    return this.users.updateAdmin({ id, ...dto });
  }

  /** Desativar usuário (ADMIN) = revogar todos os tokens */
  @Post(':id/deactivate')
  async deactivate(@Param('id') id: string, @CurrentUser() u: { role: Role }) {
    if (u.role !== Role.ADMIN) throw new ForbiddenException();
    return this.users.deactivate(id);
  }

  /** Deletar usuário (ADMIN) */
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() u: { role: Role }) {
    if (u.role !== Role.ADMIN) throw new ForbiddenException();
    return this.users.remove(id);
  }

  // ======= USUÁRIO COMUM =======

  /** Ver meus dados */
  @Get('me/profile')
  @ApiOkResponse({ type: UserDto })
  async me(@CurrentUser() u: { id: string }) {
    return this.users.getOne(u.id);
  }

  /** Atualizar meu perfil (nome/email) */
  @Patch('me/profile')
  @ApiBody({ type: UpdateOwnProfileDto })
  @ApiOkResponse({ type: UserDto })
  async updateMe(@Body() dto: UpdateOwnProfileDto, @CurrentUser() u: { id: string }) {
    return this.users.updateOwnProfile(u.id, dto);
  }

  /** Atualizar minha senha */
  @Patch('me/password')
  @ApiBody({ type: UpdateOwnPasswordDto })
  async updateMyPassword(@Body() dto: UpdateOwnPasswordDto, @CurrentUser() u: { id: string }) {
    return this.users.updateOwnPassword(u.id, dto);
  }
}
