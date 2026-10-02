import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DATABASE } from '../src/database/database.types.js';
import { setupOpenApi } from '../src/openapi.js';

describe('API docs (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATABASE)
      .useValue(null)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    setupOpenApi(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves the OpenAPI document covering every feature', async () => {
    const res = await request(app.getHttpServer())
      .get('/docs/openapi.json')
      .expect(200);

    expect(res.body.info.title).toContain('Auth Service');
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining([
        '/health',
        '/api/v1/auth/register',
        '/api/v1/auth/login',
        '/api/v1/auth/me',
      ]),
    );
  });

  it('serves the interactive docs page', async () => {
    await request(app.getHttpServer())
      .get('/docs')
      .expect(200)
      .expect('Content-Type', /html/);
  });
});
