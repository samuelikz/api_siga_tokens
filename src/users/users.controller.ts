// src/users/users.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { RoleGuard } from 'src/common/guards/role/role.guard';
import { RequireRole } from 'src/common/decorations/require-role.decorator';
import { plainToInstance } from 'class-transformer';
import { IsUUID } from 'class-validator';

import { UsersService } from './users.service';
import { PaginationQuery } from './dto/pagination.query';
import {
  CreateUserDto,
  UpdateOwnPasswordDto,
  UpdateOwnProfileDto,
  UpdateUserAdminDto,
  UserDto,
} from './dto/user.dto';
import { CurrentUser } from 'src/common/decorations/current-user.decorator';

class IdBody {
  @IsUUID()
  userId!: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard, RoleGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // ======= ADMIN =======

  @Patch('deactivate')
  @RequireRole('ADMIN')
  deactivate(@Body() body: IdBody) {
    return this.users.deactivate(body.userId);
  }

  @Patch('activate')
  @RequireRole('ADMIN')
  activate(@Body() body: IdBody) {
    return this.users.activate(body.userId);
  }

  @Patch('toggle')
  @RequireRole('ADMIN')
  toggle(@Body() body: IdBody) {
    return this.users.toggle(body.userId);
  }

  @Get()
  @RequireRole('ADMIN')
  async list(@Query() q: PaginationQuery) {
    const res = await this.users.list(q.page, q.pageSize);
    return {
      ...res,
      items: plainToInstance(UserDto, res.items, { excludeExtraneousValues: true }),
    };
  }

  @Get(':id')
  @RequireRole('ADMIN')
  async getOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const user = await this.users.getOne(id);
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }

  @Post()
  @RequireRole('ADMIN')
  async create(@Body() dto: CreateUserDto) {
    const user = await this.users.create(dto);
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @RequireRole('ADMIN')
  async updateAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: Omit<UpdateUserAdminDto, 'id'>,
  ) {
    const user = await this.users.updateAdmin({ id, ...dto });
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @RequireRole('ADMIN')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.users.remove(id);
  }

  // ======= USUÁRIO COMUM =======

  @Get('me/profile')
  async me(@CurrentUser() u: { id: string }) {
    const user = await this.users.getOne(u.id);
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }

  @Patch('me/profile')
  async updateMe(@Body() dto: UpdateOwnProfileDto, @CurrentUser() u: { id: string }) {
    const user = await this.users.updateOwnProfile(u.id, dto);
    return plainToInstance(UserDto, user, { excludeExtraneousValues: true });
  }

  @Patch('me/password')
  async updateMyPassword(@Body() dto: UpdateOwnPasswordDto, @CurrentUser() u: { id: string }) {
    return this.users.updateOwnPassword(u.id, dto);
  }
}
