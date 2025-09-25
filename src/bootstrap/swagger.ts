import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { makeSwaggerConfig } from 'src/config/swagger.config';

export function setupSwagger(app: INestApplication) {
  const doc = SwaggerModule.createDocument(app, makeSwaggerConfig());
  SwaggerModule.setup('docs', app, doc, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'API Docs',
  });
}
