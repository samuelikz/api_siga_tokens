import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TokensModule } from './tokens/tokens.module';
import { ImoveisModule } from './imoveis/imoveis.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,   
    AuthModule,
    UsersModule,
    TokensModule,
    ImoveisModule,
    UsersModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
