import { Body, Controller, ForbiddenException, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ListUsersQuery } from './dto/list-users.query/list-users.query';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user-dto/create-user.dto';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('users')
@ApiBearerAuth('bearer')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  list(@Query() q: ListUsersQuery) {
    return this.users.list(q.page!, q.pageSize!);
  }

  /** Criar usuário (apenas ADMIN) */
  @Post()
  @ApiBody({ type: CreateUserDto })
  async create(@Body() dto: CreateUserDto, @Req() req: any) {
    const role = (req?.user?.role as 'ADMIN' | 'USER' | undefined) ?? 'USER';
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Apenas ADMIN pode criar usuários.');
    }
    return this.users.create(dto);
  }
}
