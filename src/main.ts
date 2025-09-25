import 'tsconfig-paths/register';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { setupSwagger } from './bootstrap/swagger';
import { buildCorsOptionsFromEnv } from './config/cors.config';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS por env
  app.enableCors(buildCorsOptionsFromEnv());

  // middlewares / pipes / interceptors
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new BigIntInterceptor('string')); // ou 'number'

  // Swagger separado
  setupSwagger(app);

  await app.listen(Number(process.env.PORT || 3333));
}
bootstrap();
