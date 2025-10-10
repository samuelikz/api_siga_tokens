import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { TokenExpiryJob } from 'src/tokens/token-expiry.job';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    await app.get(TokenExpiryJob).deactivateExpiredTokens();
    console.log('Job de expiração executado manualmente com sucesso.');
  } finally {
    await app.close();
  }
}
main();
