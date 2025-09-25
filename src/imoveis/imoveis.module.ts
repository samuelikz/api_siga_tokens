import { Module } from '@nestjs/common';
import { ImoveisController } from './imoveis.controller';
import { ImoveisService } from './imoveis.service';
import { TokensModule } from '../tokens/tokens.module'; 
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';

@Module({
  imports: [TokensModule],          
  controllers: [ImoveisController],
  providers: [ImoveisService, ApiKeyGuard],
})
export class ImoveisModule {}