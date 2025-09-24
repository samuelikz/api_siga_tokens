import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { ListUsersQuery } from './dto/list-users.query/list-users.query';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}
  @Get()
  list(@Query() q: ListUsersQuery) {
    return this.users.list(q.page!, q.pageSize!);
  }
}
