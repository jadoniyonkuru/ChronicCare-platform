import { randomUUID } from 'node:crypto';
import {
  createDatabase,
  migrateToLatest,
} from '../src/database/create-database.js';
import type { DatabaseClient } from '../src/database/database.types.js';
import type { Medication } from '../src/medications/entities/medication.entity.js';
import { PostgresMedicationsRepository } from '../src/medications/postgres-medications.repository.js';

const PATIENT = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const OTHER_PATIENT = 'c2d4e6f8-1a3b-4c5d-8e7f-9a0b1c2d3e4f';

function medication(overrides: Partial<Medication> = {}): Medication {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    patientId: PATIENT,
    name: 'Metformin',
    dosage: '500 mg',
    timesOfDay: ['08:00', '20:00'],
    instructions: 'Take with food',
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('PostgresMedicationsRepository (integration)', () => {
  let db: DatabaseClient;
  let repository: PostgresMedicationsRepository;

  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url) {
      throw new Error(
        'TEST_DATABASE_URL is not set. Start Postgres with `docker compose up -d` and see .env.example.',
      );
    }
    db = createDatabase(url);
    await migrateToLatest(db);
    repository = new PostgresMedicationsRepository(db);
  });

  beforeEach(async () => {
    await db.deleteFrom('medications').execute();
  });

  afterAll(async () => {
    await db?.destroy();
  });

  it('is a no-op to migrate an up-to-date database', async () => {
    await expect(migrateToLatest(db)).resolves.toEqual([]);
  });

  it('round-trips every field without changing it', async () => {
    const original = medication();

    await repository.save(original);

    await expect(repository.findOne(PATIENT, original.id)).resolves.toEqual(
      original,
    );
  });

  it('keeps DATE columns as plain dates regardless of timezone', async () => {
    const saved = await repository.save(
      medication({ startDate: '2026-01-01', endDate: '2026-01-01' }),
    );

    expect(saved.startDate).toBe('2026-01-01');
    expect(saved.endDate).toBe('2026-01-01');
  });

  it('updates an existing row on save', async () => {
    const original = await repository.save(medication());

    await repository.save({
      ...original,
      dosage: '850 mg',
      endDate: null,
      updatedAt: new Date().toISOString(),
    });

    const [stored] = await repository.findByPatient(PATIENT);
    expect(stored).toMatchObject({ dosage: '850 mg', endDate: null });
    expect(stored.createdAt).toBe(original.createdAt);
  });

  it("refuses to overwrite another patient's medication", async () => {
    const original = await repository.save(medication());

    await expect(
      repository.save({ ...original, patientId: OTHER_PATIENT, name: 'X' }),
    ).rejects.toThrow();
    await expect(repository.findOne(PATIENT, original.id)).resolves.toEqual(
      original,
    );
  });

  it("lists only the patient's medications, sorted by name", async () => {
    await repository.save(medication({ name: 'Metformin' }));
    await repository.save(medication({ name: 'Lisinopril' }));
    await repository.save(
      medication({ name: 'Aspirin', patientId: OTHER_PATIENT }),
    );

    const names = (await repository.findByPatient(PATIENT)).map((m) => m.name);

    expect(names).toEqual(['Lisinopril', 'Metformin']);
  });

  it("does not find or delete another patient's medication", async () => {
    const saved = await repository.save(medication());

    await expect(
      repository.findOne(OTHER_PATIENT, saved.id),
    ).resolves.toBeUndefined();
    await expect(repository.delete(OTHER_PATIENT, saved.id)).resolves.toBe(
      false,
    );
    await expect(repository.delete(PATIENT, saved.id)).resolves.toBe(true);
    await expect(
      repository.findOne(PATIENT, saved.id),
    ).resolves.toBeUndefined();
  });

  it('enforces the date range in the database as well', async () => {
    await expect(
      repository.save(
        medication({ startDate: '2026-09-01', endDate: '2026-08-01' }),
      ),
    ).rejects.toThrow(/medications_date_range_check/);
  });
});
