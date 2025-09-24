import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ImoveisService } from './imoveis.service';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { RequiredScope } from 'src/common/guards/decorators/required-scope.decorator';
import { ListImoveisQuery } from './dto/list-imoveis.query/list-imoveis.query';

@Controller('imoveis')
@UseGuards(ApiKeyGuard)              // SECUNDÁRIA = API Key
export class ImoveisController {
  constructor(private readonly svc: ImoveisService) {}

  @Get()
  @RequiredScope('READ')             // você pode subir para WRITE/ADMIN se necessário
  list(@Query() q: ListImoveisQuery) {
    return this.svc.list(q);
  }
}
