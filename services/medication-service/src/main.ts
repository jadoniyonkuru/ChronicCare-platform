import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`medication-service listening on port ${port}`, 'Bootstrap');
}
await bootstrap();
