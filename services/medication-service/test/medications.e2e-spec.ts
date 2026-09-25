import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { DATABASE } from '../src/database/database.types.js';

const PATIENT = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const BASE = `/api/v1/patients/${PATIENT}/medications`;

const metformin = {
  name: 'Metformin',
  dosage: '500 mg',
  timesOfDay: ['08:00', '20:00'],
  startDate: '2026-09-01',
};

describe('Medications (e2e)', () => {
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

  it('supports the full create, read, update, delete lifecycle', async () => {
    const server = app.getHttpServer();

    const created = await request(server)
      .post(BASE)
      .send(metformin)
      .expect(201);
    const id: string = created.body.id;

    const list = await request(server).get(BASE).expect(200);
    expect(list.body).toHaveLength(1);

    await request(server)
      .get(`${BASE}/${id}`)
      .expect(200)
      .expect((res) => expect(res.body.name).toBe('Metformin'));

    await request(server)
      .patch(`${BASE}/${id}`)
      .send({ dosage: '850 mg' })
      .expect(200)
      .expect((res) => expect(res.body.dosage).toBe('850 mg'));

    await request(server).delete(`${BASE}/${id}`).expect(204);
    await request(server).get(`${BASE}/${id}`).expect(404);
  });

  describe('validation', () => {
    it.each([
      ['missing name', { ...metformin, name: undefined }],
      ['empty timesOfDay', { ...metformin, timesOfDay: [] }],
      ['invalid time', { ...metformin, timesOfDay: ['25:00'] }],
      ['duplicate times', { ...metformin, timesOfDay: ['08:00', '08:00'] }],
      ['impossible date', { ...metformin, startDate: '2026-02-30' }],
      ['non date-only start', { ...metformin, startDate: '2026-09-01T10:00' }],
      ['end before start', { ...metformin, endDate: '2026-08-01' }],
      ['unknown field', { ...metformin, isAdmin: true }],
    ])('rejects %s with 400', (_case, body) => {
      return request(app.getHttpServer()).post(BASE).send(body).expect(400);
    });

    it('rejects a non-UUID patient id with 400', () => {
      return request(app.getHttpServer())
        .get('/api/v1/patients/not-a-uuid/medications')
        .expect(400);
    });

    it('rejects null for a required field on update with 400', async () => {
      const server = app.getHttpServer();
      const created = await request(server)
        .post(BASE)
        .send(metformin)
        .expect(201);

      await request(server)
        .patch(`${BASE}/${created.body.id}`)
        .send({ name: null })
        .expect(400);
    });
  });

  it('returns 404 for an unknown medication', () => {
    return request(app.getHttpServer())
      .get(`${BASE}/00000000-0000-4000-8000-000000000000`)
      .expect(404);
  });
});
