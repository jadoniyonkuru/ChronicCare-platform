import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DATABASE } from '../src/database/database.types.js';
import { bearer } from './support/tokens.js';

const PATIENT = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const OTHER_PATIENT = 'c2d4e6f8-1a3b-4c5d-8e7f-9a0b1c2d3e4f';
const PROVIDER = '7b1d9e2f-3c4a-4b5d-8e6f-0a1b2c3d4e5f';
const OTHER_PROVIDER = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const CARE_TEAM = `/api/v1/patients/${PATIENT}/care-team`;

describe('Care team (e2e)', () => {
  let app: INestApplication<App>;
  const as = (userId: string, role: 'patient' | 'provider' = 'patient') =>
    request
      .agent(app.getHttpServer())
      .set('Authorization', bearer(userId, role));

  beforeEach(async () => {
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

  afterEach(async () => {
    await app.close();
  });

  it('lets a patient add, list and remove providers', async () => {
    const added = await as(PATIENT)
      .post(CARE_TEAM)
      .send({ providerId: PROVIDER })
      .expect(201);
    expect(added.body).toMatchObject({
      patientId: PATIENT,
      providerId: PROVIDER,
    });

    // Adding again is harmless and keeps the original date.
    await as(PATIENT)
      .post(CARE_TEAM)
      .send({ providerId: PROVIDER })
      .expect(201)
      .expect((res) => expect(res.body.addedAt).toBe(added.body.addedAt));

    await as(PATIENT)
      .get(CARE_TEAM)
      .expect(200)
      .expect((res) =>
        expect(
          res.body.map((m: { providerId: string }) => m.providerId),
        ).toEqual([PROVIDER]),
      );

    await as(PATIENT).delete(`${CARE_TEAM}/${PROVIDER}`).expect(204);
    await as(PATIENT).delete(`${CARE_TEAM}/${PROVIDER}`).expect(404);
    await as(PATIENT).get(CARE_TEAM).expect(200).expect([]);
  });

  it.each([
    ['their own id', { providerId: PATIENT }],
    ['an invalid id', { providerId: 'dr-house' }],
    ['a missing id', {}],
  ])('rejects adding %s with 400', async (_case, body) => {
    await as(PATIENT).post(CARE_TEAM).send(body).expect(400);
  });

  it("does not let a patient manage another patient's care team (403)", async () => {
    await as(OTHER_PATIENT)
      .post(CARE_TEAM)
      .send({ providerId: PROVIDER })
      .expect(403);
    await as(OTHER_PATIENT).get(CARE_TEAM).expect(403);
  });

  describe('GET /providers/:providerId/patients', () => {
    it('lists the patients who added the provider', async () => {
      await as(PATIENT).post(CARE_TEAM).send({ providerId: PROVIDER });
      await as(OTHER_PATIENT)
        .post(`/api/v1/patients/${OTHER_PATIENT}/care-team`)
        .send({ providerId: OTHER_PROVIDER });

      await as(PROVIDER, 'provider')
        .get(`/api/v1/providers/${PROVIDER}/patients`)
        .expect(200)
        .expect((res) =>
          expect(
            res.body.map((m: { patientId: string }) => m.patientId),
          ).toEqual([PATIENT]),
        );
    });

    it("rejects another provider's list or a patient caller (403)", async () => {
      await as(OTHER_PROVIDER, 'provider')
        .get(`/api/v1/providers/${PROVIDER}/patients`)
        .expect(403);
      await as(PROVIDER, 'patient')
        .get(`/api/v1/providers/${PROVIDER}/patients`)
        .expect(403);
    });
  });
});
