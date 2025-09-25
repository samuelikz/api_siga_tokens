// src/imoveis/imoveis.docs.ts
import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { ImovelViewDto } from './dto/imovel-view.dto.ts/imovel-view.dto';

export function ApiListImoveis() {
  return applyDecorators(
    ApiOkResponse({
      description: 'Lista paginada de imóveis',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'number', example: 1 },
                  pageSize: { type: 'number', example: 10 },
                  total: { type: 'number', example: 245 },
                },
              },
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(ImovelViewDto) },
              },
            },
          },
        },
      },
    }),
  );
}

export function ApiGetImovel() {
  return applyDecorators(
    ApiOkResponse({
      description: 'Imóvel por ID',
      schema: { $ref: getSchemaPath(ImovelViewDto) },
    }),
  );
}
