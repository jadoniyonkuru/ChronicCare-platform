import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { TOKEN_AUDIENCE, TOKEN_ISSUER } from '../src/auth/tokens.service.js';
import { DATABASE } from '../src/database/database.types.js';

const AUTH = '/api/v1/auth';
const ana = {
  email: 'ana@example.com',
  password: 'a long passphrase',
  fullName: 'Ana Uwase',
};

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Always run e2e tests in-memory, even if .env sets DATABASE_URL.
      .overrideProvider(DATABASE)
      .useValue(null)
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('registers, logs in, and reads the account with the token', async () => {
    const server = app.getHttpServer();

    const registered = await request(server)
      .post(`${AUTH}/register`)
      .send(ana)
      .expect(201);
    expect(registered.body.user).toMatchObject({
      email: 'ana@example.com',
      role: 'patient',
    });
    expect(registered.body.user).not.toHaveProperty('passwordHash');

    const login = await request(server)
      .post(`${AUTH}/login`)
      .send({ email: 'ANA@example.com', password: ana.password })
      .expect(200);

    await request(server)
      .get(`${AUTH}/me`)
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200)
      .expect((res) => expect(res.body.id).toBe(registered.body.user.id));
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app.getHttpServer())
      .post(`${AUTH}/register`)
      .send(ana)
      .expect(201);
    await request(app.getHttpServer())
      .post(`${AUTH}/register`)
      .send(ana)
      .expect(409);
  });

  it('rejects a wrong password with 401', async () => {
    await request(app.getHttpServer()).post(`${AUTH}/register`).send(ana);

    await request(app.getHttpServer())
      .post(`${AUTH}/login`)
      .send({ email: ana.email, password: 'wrong passphrase' })
      .expect(401);
  });

  it.each([
    ['an invalid email', { ...ana, email: 'not-an-email' }],
    ['a short password', { ...ana, password: 'short' }],
    ['a missing name', { ...ana, fullName: undefined }],
    ['a role (providers cannot self-register)', { ...ana, role: 'provider' }],
  ])('rejects registration with %s with 400', async (_case, body) => {
    await request(app.getHttpServer())
      .post(`${AUTH}/register`)
      .send(body)
      .expect(400);
  });

  describe('GET /me', () => {
    const signed = (secret: string, claims: object) =>
      new JwtService({ secret }).sign(
        { role: 'patient', ...claims },
        {
          subject: '00000000-0000-4000-8000-000000000000',
          issuer: TOKEN_ISSUER,
          audience: TOKEN_AUDIENCE,
        },
      );

    it.each([
      ['no token', undefined],
      ['a malformed header', 'Token abc'],
      ['a garbage token', 'Bearer abc.def.ghi'],
      [
        'a token signed with another secret',
        `Bearer ${signed('another-secret-that-is-also-32-characters', {})}`,
      ],
      [
        'an expired token',
        `Bearer ${signed('test-secret-that-is-at-least-32-characters', {
          exp: Math.floor(Date.now() / 1000) - 10,
        })}`,
      ],
    ])('rejects %s with 401', async (_case, header) => {
      const req = request(app.getHttpServer()).get(`${AUTH}/me`);
      if (header) req.set('Authorization', header);
      await req.expect(401);
    });
  });
});
