import { Module } from '@nestjs/common';
import { CartoriosController } from './cartorios.controller';
import { CartoriosService } from './cartorios.service';
import { PrismaSecondaryService } from '../prisma/prisma-secondary.service';
import { TokensModule } from 'src/tokens/tokens.module'; 

@Module({
  imports: [TokensModule],
  controllers: [CartoriosController],
  providers: [PrismaSecondaryService, CartoriosService],
  exports: [CartoriosService],
})
export class CartoriosModule {}
