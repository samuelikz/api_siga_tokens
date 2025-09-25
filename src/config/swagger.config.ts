import { DocumentBuilder } from '@nestjs/swagger';

export function makeSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('API')
    .setDescription('Documentação da API')
    .setVersion(process.env.npm_package_version ?? '1.0.0')
    // Auth por JWT (se tiver) e também por API Key no header (x-api-key)
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'bearer',
    )
    .addApiKey(
      { type: 'apiKey', name: 'x-api-key', in: 'header', description: 'API key' },
      'api-key',
    )
    // opcional: servidores conhecidos
    .addServer(process.env.SWAGGER_SERVER_URL ?? 'http://localhost:3011')
    .build();
}
