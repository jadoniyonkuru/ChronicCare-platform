import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { Clock } from '../src/common/clock.js';
import { DATABASE } from '../src/database/database.types.js';

const PATIENT = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const MEDICATIONS = `/api/v1/patients/${PATIENT}/medications`;
const NOW = new Date('2026-09-26T10:00:00.000Z');

describe('Doses (e2e)', () => {
  let app: INestApplication<App>;
  let doses: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DATABASE)
      .useValue(null)
      .overrideProvider(Clock)
      .useValue({ now: () => NOW })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    const medication = await request(app.getHttpServer())
      .post(MEDICATIONS)
      .send({
        name: 'Metformin',
        dosage: '500 mg',
        timesOfDay: ['08:00', '20:00'],
        startDate: '2026-09-01',
      })
      .expect(201);
    doses = `${MEDICATIONS}/${medication.body.id}/doses`;
  });

  afterEach(async () => {
    await app.close();
  });

  it('records, corrects, lists and undoes a dose', async () => {
    const server = app.getHttpServer();

    await request(server)
      .put(`${doses}/2026-09-25/08:00`)
      .send({ status: 'skipped' })
      .expect(200)
      .expect((res) => expect(res.body.status).toBe('skipped'));

    await request(server)
      .put(`${doses}/2026-09-25/08:00`)
      .send({ status: 'taken', takenAt: '2026-09-25T08:10:00Z' })
      .expect(200)
      .expect((res) =>
        expect(res.body).toMatchObject({
          status: 'taken',
          takenAt: '2026-09-25T08:10:00.000Z',
        }),
      );

    await request(server)
      .get(doses)
      .query({ from: '2026-09-25', to: '2026-09-25' })
      .expect(200)
      .expect((res) => expect(res.body).toHaveLength(1));

    await request(server).delete(`${doses}/2026-09-25/08:00`).expect(204);
    await request(server).delete(`${doses}/2026-09-25/08:00`).expect(404);
  });

  describe('validation', () => {
    it.each([
      ['an invalid date', '2026-02-30/08:00', { status: 'taken' }],
      ['an invalid time', '2026-09-25/8am', { status: 'taken' }],
      ['an unscheduled time', '2026-09-25/09:00', { status: 'taken' }],
      ['an unknown status', '2026-09-25/08:00', { status: 'maybe' }],
      ['a missing status', '2026-09-25/08:00', {}],
      ['an unknown field', '2026-09-25/08:00', { status: 'taken', x: 1 }],
    ])('rejects %s with 400', async (_case, path, body) => {
      await request(app.getHttpServer())
        .put(`${doses}/${path}`)
        .send(body)
        .expect(400);
    });

    it('rejects an invalid date range with 400', async () => {
      await request(app.getHttpServer())
        .get(doses)
        .query({ from: '2026-09-30', to: '2026-09-01' })
        .expect(400);
    });
  });

  it('returns 404 for an unknown medication', async () => {
    await request(app.getHttpServer())
      .put(
        `${MEDICATIONS}/00000000-0000-4000-8000-000000000000/doses/2026-09-25/08:00`,
      )
      .send({ status: 'taken' })
      .expect(404);
  });
});
