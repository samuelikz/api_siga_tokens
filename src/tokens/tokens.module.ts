// src/tokens/tokens.module.ts
import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TokensController } from './tokens.controller';
import { TokensAdminController } from './tokens-admin.controller';
import { TokenExpiryJob } from './token-expiry.job';

@Module({
  providers: [TokensService, TokenExpiryJob],
  controllers: [TokensController, TokensAdminController],
  exports: [TokensService],
})
export class TokensModule {}
