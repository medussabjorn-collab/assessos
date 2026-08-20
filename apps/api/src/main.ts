import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Split on commas so the marketing site's origin can be allowed alongside
  // apps/web's without disturbing existing single-origin CORS_ORIGIN values
  // (comma-split of a single value is just an array of length 1).
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3001')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`✓ API listening on http://localhost:${port}`);
}

bootstrap().catch(console.error);
