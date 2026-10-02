import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DATABASE } from '../src/database/database.types.js';

describe('Login rate limiting (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    // This file runs in its own process, so this only affects these tests.
    process.env.AUTH_RATE_LIMIT_PER_MINUTE = '3';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATABASE)
      .useValue(null)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks a client after too many login attempts', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'guess@example.com', password: 'guess-1234567' });

    for (let i = 0; i < 3; i++) {
      await attempt().expect(401);
    }
    await attempt().expect(429);
  });
});
