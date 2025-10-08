// src/users/users.controller.ts
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { UsersService } from './users.service';
import { PaginationQuery } from './dto/pagination.query';
import {
  CreateUserDto,
  UpdateOwnPasswordDto,
  UpdateOwnProfileDto,
  UpdateUserAdminDto,
  UserDto,
} from './dto/user.dto';
import { Role } from './user.types';
import { CurrentUser } from 'src/common/decorations/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('users')
@ApiBearerAuth('bearer')
@ApiExtraModels(UserDto)
export class UsersController {
  constructor(private users: UsersService) {}

  // ======= ADMIN =======

  /** Listar usuários (ADMIN) */
  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        page: { type: 'integer', example: 1 },
        pageSize: { type: 'integer', example: 20 },
        total: { type: 'integer', example: 132 },
        items: {
          type: 'array',
          items: { $ref: getSchemaPath(UserDto) },
        },
      },
    },
  })
  async list(@Query() q: PaginationQuery, @CurrentUser() u: { role: Role }) {
    if (u.role !== Role.ADMIN) throw new ForbiddenException();
    const res = await this.users.list(q.page, q.pageSize);
    return {
      ...res,
      items: plainToInstance(UserDto, res.items, { excludeExtraneousValues: true }),
    };
  }

  /** Obter um usuário (ADMIN) */
  @Get(':id')
  @ApiOkResponse({ type: UserDto })
  async getOne(@Param('id') id: string, @CurrentUser() u: { role: Role }) {
    if (u.role !== Role.ADMIN) throw new ForbiddenException();
    const user = await this.users.getOne(id);
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }

  /** Criar usuário (ADMIN) */
  @Post()
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({ type: UserDto })
  async create(@Body() dto: CreateUserDto, @CurrentUser() u: { role: Role }) {
    if (u.role !== Role.ADMIN) {
      throw new ForbiddenException('Apenas ADMIN pode criar usuários.');
    }
    const user = await this.users.create(dto);
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
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
    const user = await this.users.updateAdmin({ id, ...dto });
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }

  /** Desativar usuário (ADMIN) = revogar todos os tokens */
  @Post(':id/deactivate')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        revoked: { type: 'integer', example: 3 },
      },
    },
  })
  async deactivate(@Param('id') id: string, @CurrentUser() u: { role: Role }) {
    if (u.role !== Role.ADMIN) throw new ForbiddenException();
    return this.users.deactivate(id);
  }

  /** Deletar usuário (ADMIN) */
  @Delete(':id')
  @ApiOkResponse({ schema: { type: 'object', properties: { success: { type: 'boolean', example: true } } } })
  async remove(@Param('id') id: string, @CurrentUser() u: { role: Role }) {
    if (u.role !== Role.ADMIN) throw new ForbiddenException();
    return this.users.remove(id);
  }

  // ======= USUÁRIO COMUM =======

  /** Ver meus dados */
  @Get('me/profile')
  @ApiOkResponse({ type: UserDto })
  async me(@CurrentUser() u: { id: string }) {
    const user = await this.users.getOne(u.id);
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }

  /** Atualizar meu perfil (nome/email) */
  @Patch('me/profile')
  @ApiBody({ type: UpdateOwnProfileDto })
  @ApiOkResponse({ type: UserDto })
  async updateMe(@Body() dto: UpdateOwnProfileDto, @CurrentUser() u: { id: string }) {
    const user = await this.users.updateOwnProfile(u.id, dto);
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }

  /** Atualizar minha senha */
  @Patch('me/password')
  @ApiBody({ type: UpdateOwnPasswordDto })
  @ApiOkResponse({ schema: { type: 'object', properties: { success: { type: 'boolean', example: true } } } })
  async updateMyPassword(@Body() dto: UpdateOwnPasswordDto, @CurrentUser() u: { id: string }) {
    return this.users.updateOwnPassword(u.id, dto);
  }
}
