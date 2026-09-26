import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { Clock } from '../src/common/clock.js';
import { DATABASE } from '../src/database/database.types.js';

const PATIENT = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const BASE = `/api/v1/patients/${PATIENT}`;
const NOW = new Date('2026-09-26T10:00:00.000Z');

describe('Adherence (e2e)', () => {
  let app: INestApplication<App>;

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
  });

  afterEach(async () => {
    await app.close();
  });

  it('reports adherence from logged doses', async () => {
    const server = app.getHttpServer();
    const medication = await request(server)
      .post(`${BASE}/medications`)
      .send({
        name: 'Metformin',
        dosage: '500 mg',
        timesOfDay: ['08:00', '20:00'],
        startDate: '2026-09-24',
      })
      .expect(201);
    const doses = `${BASE}/medications/${medication.body.id}/doses`;

    // 2026-09-24: both taken. 2026-09-25: morning skipped, evening missed.
    // 2026-09-26 (today): morning taken, evening still pending.
    for (const [slot, status] of [
      ['2026-09-24/08:00', 'taken'],
      ['2026-09-24/20:00', 'taken'],
      ['2026-09-25/08:00', 'skipped'],
      ['2026-09-26/08:00', 'taken'],
    ]) {
      await request(server)
        .put(`${doses}/${slot}`)
        .send({ status })
        .expect(200);
    }

    const res = await request(server)
      .get(`${BASE}/adherence`)
      .query({ from: '2026-09-24', to: '2026-09-26' })
      .expect(200);

    expect(res.body).toMatchObject({
      from: '2026-09-24',
      to: '2026-09-26',
      due: 5,
      taken: 3,
      skipped: 1,
      missed: 1,
      pending: 1,
      adherencePercent: 60,
      medications: [
        { medicationId: medication.body.id, name: 'Metformin', due: 5 },
      ],
    });
  });

  it('defaults to the last 30 days', async () => {
    const res = await request(app.getHttpServer())
      .get(`${BASE}/adherence`)
      .expect(200);

    expect(res.body).toMatchObject({
      from: '2026-08-28',
      to: '2026-09-26',
      adherencePercent: null,
      medications: [],
    });
  });

  it('rejects an invalid patient id or range with 400', async () => {
    const server = app.getHttpServer();
    await request(server).get('/api/v1/patients/nope/adherence').expect(400);
    await request(server)
      .get(`${BASE}/adherence`)
      .query({ from: '2026-09-30', to: '2026-09-01' })
      .expect(400);
  });
});
