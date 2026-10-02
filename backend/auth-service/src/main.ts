import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';
import { setupOpenApi } from './openapi.js';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  setupOpenApi(app);
  const port = Number(process.env.PORT ?? 3002);
  await app.listen(port);
  Logger.log(
    `auth-service listening on port ${port} (API docs at /docs)`,
    'Bootstrap',
  );
}
await bootstrap();
