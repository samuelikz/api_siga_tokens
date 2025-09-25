import { DocumentBuilder } from '@nestjs/swagger';

export function makeSwaggerSecondaryConfig() {
  return new DocumentBuilder()
    .setTitle('API Secundária')
    .setDescription('Rotas expostas do datasource secundário')
    .setVersion(process.env.npm_package_version ?? '1.0.0')
    .build();
}
