import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DATABASE } from '../src/database/database.types.js';
import { setupOpenApi } from '../src/openapi.js';
import { accessToken, bearer } from './support/tokens.js';

const PATIENT = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const OTHER_PATIENT = 'c2d4e6f8-1a3b-4c5d-8e7f-9a0b1c2d3e4f';
const PROVIDER = '7b1d9e2f-3c4a-4b5d-8e6f-0a1b2c3d4e5f';
const MEDICATIONS = `/api/v1/patients/${PATIENT}/medications`;
const metformin = {
  name: 'Metformin',
  dosage: '500 mg',
  timesOfDay: ['08:00'],
  startDate: '2026-09-01',
};

describe('Access control (e2e)', () => {
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

  describe('authentication', () => {
    it.each([
      ['no token', undefined],
      ['a malformed header', 'Token abc'],
      ['a garbage token', 'Bearer abc.def.ghi'],
      [
        'a token signed with another secret',
        `Bearer ${accessToken(PATIENT, 'patient', {
          secret: 'another-secret-that-is-also-32-characters',
        })}`,
      ],
      [
        'an expired token',
        `Bearer ${accessToken(PATIENT, 'patient', { expiresIn: -10 })}`,
      ],
    ])('rejects %s with 401', async (_case, header) => {
      const req = request(app.getHttpServer()).get(MEDICATIONS);
      if (header) req.set('Authorization', header);
      await req.expect(401);
    });

    it('keeps health checks and API docs public', async () => {
      await request(app.getHttpServer()).get('/health').expect(200);
      await request(app.getHttpServer()).get('/docs/openapi.json').expect(200);
    });
  });

  describe('patients', () => {
    it('can manage their own medications', async () => {
      await request(app.getHttpServer())
        .post(MEDICATIONS)
        .set('Authorization', bearer(PATIENT))
        .send(metformin)
        .expect(201);
    });

    it.each([
      ['read', 'get', ''],
      ['add to', 'post', ''],
    ] as const)(
      "cannot %s another patient's medications (403)",
      async (_case, method, suffix) => {
        await request(app.getHttpServer())
          [method](`${MEDICATIONS}${suffix}`)
          .set('Authorization', bearer(OTHER_PATIENT))
          .send(metformin)
          .expect(403);
      },
    );

    it("cannot read another patient's adherence (403)", async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/patients/${PATIENT}/adherence`)
        .set('Authorization', bearer(OTHER_PATIENT))
        .expect(403);
    });
  });

  describe('providers', () => {
    const asProvider = (method: 'get' | 'post', url: string) =>
      request(app.getHttpServer())
        [method](url)
        .set('Authorization', bearer(PROVIDER, 'provider'));
    const addToCareTeam = () =>
      request(app.getHttpServer())
        .post(`/api/v1/patients/${PATIENT}/care-team`)
        .set('Authorization', bearer(PATIENT))
        .send({ providerId: PROVIDER })
        .expect(201);

    beforeEach(async () => {
      await request(app.getHttpServer())
        .post(MEDICATIONS)
        .set('Authorization', bearer(PATIENT))
        .send(metformin)
        .expect(201);
    });

    it("cannot read a patient's data before being added to the care team (403)", async () => {
      await asProvider('get', MEDICATIONS).expect(403);
      await asProvider('get', `/api/v1/patients/${PATIENT}/adherence`).expect(
        403,
      );
    });

    it("can read a patient's medications and adherence once on the care team", async () => {
      await addToCareTeam();

      await asProvider('get', MEDICATIONS)
        .expect(200)
        .expect((res) => expect(res.body).toHaveLength(1));
      await asProvider('get', `/api/v1/patients/${PATIENT}/adherence`).expect(
        200,
      );
    });

    it('loses access as soon as the patient removes them', async () => {
      await addToCareTeam();
      await request(app.getHttpServer())
        .delete(`/api/v1/patients/${PATIENT}/care-team/${PROVIDER}`)
        .set('Authorization', bearer(PATIENT))
        .expect(204);

      await asProvider('get', MEDICATIONS).expect(403);
    });

    it("cannot change a patient's medications even on the care team (403)", async () => {
      await addToCareTeam();

      await asProvider('post', MEDICATIONS).send(metformin).expect(403);
    });

    it('cannot add themselves to a care team (403)', async () => {
      await asProvider('post', `/api/v1/patients/${PATIENT}/care-team`)
        .send({ providerId: PROVIDER })
        .expect(403);
    });
  });
});
