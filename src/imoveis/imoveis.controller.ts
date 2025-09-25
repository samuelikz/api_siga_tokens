// src/imoveis/imoveis.controller.ts
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiExtraModels, ApiSecurity, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';

import { ImoveisService } from './imoveis.service';
import { ApiListImoveis, ApiGetImovel } from './imoveis.docs';
import { ImovelViewDto } from './dto/imovel-view.dto.ts/imovel-view.dto';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { RequiredScope } from 'src/common/guards/decorators/required-scope.decorator';
import { CreateImovelDto } from './dto/create-imovel.dto/create-imovel.dto';


@ApiTags('imoveis')
@ApiSecurity('api-key') // x-api-key no header (ou ?apikey= em GET)
@ApiExtraModels(ImovelViewDto)
@UseGuards(ApiKeyGuard)
@Controller('imoveis')
export class ImoveisController {
  constructor(private readonly imoveis: ImoveisService) {}

  @Get()
  @RequiredScope('READ') // GET aceita ?apikey= (o guard valida)
  @ApiQuery({ name: 'search', required: false, example: 'rua' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 10 }) // apenas exemplo visual; default real vem do .env
  @ApiQuery({ name: 'numg_municipio', required: false, example: 2604106 })
  @ApiQuery({ name: 'numg_destinacao', required: false, example: 1 })
  @ApiListImoveis()
  list(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('numg_municipio') numg_municipio?: number,
    @Query('numg_destinacao') numg_destinacao?: number,
  ) {
    return this.imoveis.list({
      search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined, // se vier vazio, o service usa o DEFAULT do .env
      numg_municipio: numg_municipio ? Number(numg_municipio) : undefined,
      numg_destinacao: numg_destinacao ? Number(numg_destinacao) : undefined,
    });
  }

  @Get(':id')
  @RequiredScope('READ')
  @ApiParam({ name: 'id', description: 'numg_imovel (BigInt como string)', example: '12345' })
  @ApiGetImovel()
  findOne(@Param('id') id: string) {
    return this.imoveis.findById(id);
  }

  @Post()
  @RequiredScope('WRITE') // POST só aceita x-api-key no HEADER (query é bloqueada pelo guard)
  // (Opcional) @ApiCreatedResponse(...)
  create(@Body() dto: CreateImovelDto) {
    return this.imoveis.create(dto);
  }
}
