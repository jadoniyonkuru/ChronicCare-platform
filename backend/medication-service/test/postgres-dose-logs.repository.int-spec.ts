import { randomUUID } from 'node:crypto';
import {
  createDatabase,
  migrateToLatest,
} from '../src/database/create-database.js';
import type { DatabaseClient } from '../src/database/database.types.js';
import type { DoseLog } from '../src/doses/entities/dose-log.entity.js';
import { PostgresDoseLogsRepository } from '../src/doses/postgres-dose-logs.repository.js';
import { PostgresMedicationsRepository } from '../src/medications/postgres-medications.repository.js';

const PATIENT = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const OTHER_PATIENT = 'c2d4e6f8-1a3b-4c5d-8e7f-9a0b1c2d3e4f';

describe('PostgresDoseLogsRepository (integration)', () => {
  let db: DatabaseClient;
  let repository: PostgresDoseLogsRepository;
  let medications: PostgresMedicationsRepository;
  let medicationId: string;

  function doseLog(overrides: Partial<DoseLog> = {}): DoseLog {
    return {
      id: randomUUID(),
      medicationId,
      patientId: PATIENT,
      scheduledDate: '2026-09-20',
      scheduledTime: '08:00',
      status: 'taken',
      takenAt: '2026-09-20T08:05:00.000Z',
      note: null,
      createdAt: '2026-09-20T08:05:00.000Z',
      updatedAt: '2026-09-20T08:05:00.000Z',
      ...overrides,
    };
  }

  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url) {
      throw new Error(
        'TEST_DATABASE_URL is not set. Start Postgres with `docker compose up -d` and see .env.example.',
      );
    }
    db = createDatabase(url);
    await migrateToLatest(db);
    repository = new PostgresDoseLogsRepository(db);
    medications = new PostgresMedicationsRepository(db);
  });

  beforeEach(async () => {
    await db.deleteFrom('medications').execute();
    const medication = await medications.save({
      id: randomUUID(),
      patientId: PATIENT,
      name: 'Metformin',
      dosage: '500 mg',
      timesOfDay: ['08:00', '20:00'],
      instructions: null,
      startDate: '2026-09-01',
      endDate: null,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    });
    medicationId = medication.id;
  });

  afterAll(async () => {
    await db?.destroy();
  });

  it('round-trips every field without changing it', async () => {
    const original = doseLog({ note: 'With breakfast' });

    await expect(repository.upsert(original)).resolves.toEqual(original);
  });

  it('updates the existing log for the same slot, keeping id and createdAt', async () => {
    const first = await repository.upsert(doseLog());

    const second = await repository.upsert(
      doseLog({
        status: 'skipped',
        takenAt: null,
        updatedAt: '2026-09-20T09:00:00.000Z',
      }),
    );

    expect(second).toMatchObject({
      id: first.id,
      createdAt: first.createdAt,
      status: 'skipped',
      takenAt: null,
      updatedAt: '2026-09-20T09:00:00.000Z',
    });
  });

  it('refuses to overwrite a slot owned by another patient', async () => {
    const original = await repository.upsert(doseLog());

    await expect(
      repository.upsert(
        doseLog({ patientId: OTHER_PATIENT, status: 'skipped', takenAt: null }),
      ),
    ).rejects.toThrow();
    const [stored] = await repository.find(PATIENT, {
      from: '2026-09-20',
      to: '2026-09-20',
    });
    expect(stored).toEqual(original);
  });

  it('filters by date range and medication, sorted by date then time', async () => {
    await repository.upsert(doseLog({ scheduledTime: '20:00' }));
    await repository.upsert(doseLog({ scheduledTime: '08:00' }));
    await repository.upsert(doseLog({ scheduledDate: '2026-09-19' }));
    await repository.upsert(doseLog({ scheduledDate: '2026-09-25' }));

    const logs = await repository.find(PATIENT, {
      from: '2026-09-19',
      to: '2026-09-20',
      medicationId,
    });

    expect(logs.map((l) => `${l.scheduledDate} ${l.scheduledTime}`)).toEqual([
      '2026-09-19 08:00',
      '2026-09-20 08:00',
      '2026-09-20 20:00',
    ]);
  });

  it("only deletes the patient's own log", async () => {
    await repository.upsert(doseLog());

    await expect(
      repository.delete(OTHER_PATIENT, medicationId, '2026-09-20', '08:00'),
    ).resolves.toBe(false);
    await expect(
      repository.delete(PATIENT, medicationId, '2026-09-20', '08:00'),
    ).resolves.toBe(true);
  });

  it('deletes dose logs when their medication is deleted', async () => {
    await repository.upsert(doseLog());

    await medications.delete(PATIENT, medicationId);

    await expect(
      repository.find(PATIENT, { from: '2026-09-01', to: '2026-09-30' }),
    ).resolves.toEqual([]);
  });

  it('rejects a taken-at time on a skipped dose', async () => {
    await expect(
      repository.upsert(doseLog({ status: 'skipped' })),
    ).rejects.toThrow(/dose_logs_taken_at_check/);
  });
});
