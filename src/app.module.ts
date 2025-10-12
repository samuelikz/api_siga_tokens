import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import paginationConfig from './config/pagination.config';
import { PaginationInterceptor } from './common/interceptors/pagination.interceptor';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TokensModule } from './tokens/tokens.module';
import { ImoveisModule } from './imoveis/imoveis.module';
import { CartoriosModule } from './cartorios/cartorios.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [paginationConfig] }),
    ScheduleModule.forRoot(),

    PrismaModule,
    AuthModule,
    UsersModule,
    TokensModule,
    ImoveisModule,
    CartoriosModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: PaginationInterceptor },
  ],
})
export class AppModule {}
