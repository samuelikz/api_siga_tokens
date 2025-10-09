// src/tokens/tokens.module.ts
import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TokensController } from './tokens.controller';
import { TokensAdminController } from './tokens-admin.controller';

@Module({
  providers: [TokensService],
  controllers: [TokensController, TokensAdminController],
  exports: [TokensService],
})
export class TokensModule {}
