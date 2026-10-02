import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const DOCS_PATH = 'docs';

/**
 * Serves interactive API docs at /docs and the raw OpenAPI document at
 * /docs/openapi.json. Request and response schemas are generated from the
 * DTO and entity classes by the @nestjs/swagger CLI plugin (nest-cli.json).
 */
export function setupOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('ChronicCare Pro: Medication Service')
    .setDescription(
      'Medication schedules, dose logging and adherence reports for patients with chronic conditions.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('medications', "A patient's medication schedules")
    .addTag('doses', 'Recording whether scheduled doses were taken')
    .addTag('adherence', 'How consistently a patient takes their medication')
    .addTag('health', 'Service status')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(DOCS_PATH, app, document, {
    jsonDocumentUrl: `${DOCS_PATH}/openapi.json`,
    customSiteTitle: 'ChronicCare Pro API',
  });
}
