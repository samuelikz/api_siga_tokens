import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { makeSwaggerSecondaryConfig } from '../config/swagger.config';

// importe SOMENTE os módulos da API secundária
import { ImoveisModule } from '../imoveis/imoveis.module'; // ajuste se o nome/caminho for outro

export function setupSwaggerSecondary(app: INestApplication) {
  const config = makeSwaggerSecondaryConfig();

  const document = SwaggerModule.createDocument(app, config, {
    // 👇 só esses módulos entram na doc
    include: [ImoveisModule],
    // opcional: se quiser filtrar por paths prefixados, poderia usar 'deepScanRoutes: true'
  });

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { docExpansion: 'none', persistAuthorization: true },
    customSiteTitle: 'API Secundária - Docs',
  });
}
