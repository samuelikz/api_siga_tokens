import 'tsconfig-paths/register';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { buildCorsOptionsFromEnv } from './config/cors.config'; // se já tiver
import { setupSwaggerSecondary } from './bootstrap/swagger-secondary';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(buildCorsOptionsFromEnv?.() ?? true);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new BigIntInterceptor('string'));

  setupSwaggerSecondary(app);

  await app.listen(Number(process.env.PORT || 3333));
}
bootstrap();
