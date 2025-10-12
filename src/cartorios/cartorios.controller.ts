import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { ApiParam, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { CartoriosService } from './cartorios.service';
import { ApiKeyGuard } from 'src/common/guards/api-key/api-key.guard';
import { RequiredScope } from 'src/common/guards/decorators/required-scope.decorator';
import { CreateCartorioDto } from './dto/create-cartorio.dto';
import { UpdateCartorioDto } from './dto/update-cartorio.dto';

// Import separados p/ evitar erro ts(1272)
import { Pagination as PaginationDecorator } from 'src/common/pagination';
import type { Pagination as PaginationType } from 'src/common/pagination';

@ApiTags('cartorios')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('cartorios')
export class CartoriosController {
  constructor(private readonly service: CartoriosService) {}

  @Get()
  @RequiredScope('READ')
  @ApiQuery({ name: 'search', required: false, example: 'ofício' })
  @ApiQuery({ name: 'numg_municipio', required: false, example: 2607901 })
  list(
    @PaginationDecorator() pg: PaginationType, // { page, pageSize, offset, limit }
    @Query('search') search?: string,
    @Query('numg_municipio') numg_municipio?: string,
  ) {
    return this.service.list({
      ...pg,
      search,
      numg_municipio: numg_municipio ? Number(numg_municipio) : undefined,
    });
  }

  @Get(':id')
  @RequiredScope('READ')
  @ApiParam({ name: 'id', description: 'numg_cartorio (Int)', example: 13 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOneWithGeometries(id);
  }

  @Post()
  @RequiredScope('WRITE')
  create(@Body() dto: CreateCartorioDto) {
    return this.service.create({
      nome_cartorio: dto.nome_cartorio ?? null,
      desc_cartorio: dto.desc_cartorio ?? null,
      ad_municipio: { connect: { numg_municipio: dto.numg_municipio } },
    } as any);
  }

  @Patch(':id')
  @RequiredScope('WRITE')
  @ApiParam({ name: 'id', example: 13 })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCartorioDto) {
    const data: any = {};
    if (dto.nome_cartorio !== undefined) data.nome_cartorio = dto.nome_cartorio;
    if (dto.desc_cartorio !== undefined) data.desc_cartorio = dto.desc_cartorio;
    if (dto.numg_municipio !== undefined) {
      data.ad_municipio = { connect: { numg_municipio: dto.numg_municipio } };
    }
    if (dto.replace_geometrias !== undefined) data.replace_geometrias = dto.replace_geometrias;
    if (dto.geometrias?.length) data.geometrias = dto.geometrias;

    return this.service.update(id, data);
  }

  @Delete(':id')
  @RequiredScope('WRITE')
  @ApiParam({ name: 'id', example: 13 })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
