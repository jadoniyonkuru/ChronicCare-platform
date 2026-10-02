import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const DOCS_PATH = 'docs';

/**
 * Serves interactive API docs at /docs and the raw OpenAPI document at
 * /docs/openapi.json. Schemas are generated from the DTO and entity classes
 * by the @nestjs/swagger CLI plugin (nest-cli.json).
 */
export function setupOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('ChronicCare Pro: Auth Service')
    .setDescription(
      'Patient registration, login, and JWT access tokens for the ChronicCare Pro APIs.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Accounts, login and access tokens')
    .addTag('health', 'Service status')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(DOCS_PATH, app, document, {
    jsonDocumentUrl: `${DOCS_PATH}/openapi.json`,
    customSiteTitle: 'ChronicCare Pro Auth API',
  });
}
