import { INestApplication } from '@nestjs/common';

export const API_PREFIX = 'api/v1';

/**
 * App-wide settings shared by main.ts and the e2e tests, so tests exercise
 * the same routes and behaviour as the running service.
 */
export function configureApp(app: INestApplication): INestApplication {
  // Health stays at /health so load balancers and Docker can probe it
  // without knowing the API version.
  app.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });
  app.enableShutdownHooks();
  return app;
}
