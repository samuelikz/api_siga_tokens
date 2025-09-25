import { Global, Module } from '@nestjs/common';
import { PrismaPrimaryService } from './prisma-primary.service';
import { PrismaSecondaryService } from './prisma-secondary.service';

@Global() 
@Module({
  providers: [PrismaPrimaryService, PrismaSecondaryService],
  exports:   [PrismaPrimaryService, PrismaSecondaryService],
})
export class PrismaModule {}
