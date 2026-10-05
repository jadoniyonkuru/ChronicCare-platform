import { PostgresCareTeamRepository } from '../src/care-team/postgres-care-team.repository.js';
import {
  createDatabase,
  migrateToLatest,
} from '../src/database/create-database.js';
import type { DatabaseClient } from '../src/database/database.types.js';

const PATIENT = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const OTHER_PATIENT = 'c2d4e6f8-1a3b-4c5d-8e7f-9a0b1c2d3e4f';
const PROVIDER = '7b1d9e2f-3c4a-4b5d-8e6f-0a1b2c3d4e5f';
const OTHER_PROVIDER = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

describe('PostgresCareTeamRepository (integration)', () => {
  let db: DatabaseClient;
  let repository: PostgresCareTeamRepository;

  const link = (patientId: string, providerId: string, addedAt: string) =>
    repository.add({ patientId, providerId, addedAt });

  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url) {
      throw new Error(
        'TEST_DATABASE_URL is not set. Start Postgres with `docker compose up -d postgres` and see .env.example.',
      );
    }
    db = createDatabase(url);
    await migrateToLatest(db);
    repository = new PostgresCareTeamRepository(db);
  });

  beforeEach(async () => {
    await db.deleteFrom('careTeamMembers').execute();
  });

  afterAll(async () => {
    await db?.destroy();
  });

  it('adds a link and keeps the original date when added again', async () => {
    const first = await link(PATIENT, PROVIDER, '2026-10-05T09:00:00.000Z');
    const again = await link(PATIENT, PROVIDER, '2026-10-06T09:00:00.000Z');

    expect(first).toEqual({
      patientId: PATIENT,
      providerId: PROVIDER,
      addedAt: '2026-10-05T09:00:00.000Z',
    });
    expect(again).toEqual(first);
  });

  it('answers membership checks', async () => {
    await link(PATIENT, PROVIDER, '2026-10-05T09:00:00.000Z');

    await expect(repository.isMember(PATIENT, PROVIDER)).resolves.toBe(true);
    await expect(repository.isMember(PATIENT, OTHER_PROVIDER)).resolves.toBe(
      false,
    );
    await expect(repository.isMember(OTHER_PATIENT, PROVIDER)).resolves.toBe(
      false,
    );
  });

  it('lists by patient and by provider, oldest first', async () => {
    await link(PATIENT, OTHER_PROVIDER, '2026-10-06T09:00:00.000Z');
    await link(PATIENT, PROVIDER, '2026-10-05T09:00:00.000Z');
    await link(OTHER_PATIENT, PROVIDER, '2026-10-07T09:00:00.000Z');

    const team = await repository.listForPatient(PATIENT);
    const patients = await repository.listForProvider(PROVIDER);

    expect(team.map((m) => m.providerId)).toEqual([PROVIDER, OTHER_PROVIDER]);
    expect(patients.map((m) => m.patientId)).toEqual([PATIENT, OTHER_PATIENT]);
  });

  it('removes a link', async () => {
    await link(PATIENT, PROVIDER, '2026-10-05T09:00:00.000Z');

    await expect(repository.remove(PATIENT, PROVIDER)).resolves.toBe(true);
    await expect(repository.remove(PATIENT, PROVIDER)).resolves.toBe(false);
    await expect(repository.isMember(PATIENT, PROVIDER)).resolves.toBe(false);
  });

  it('rejects linking a patient to themselves', async () => {
    await expect(
      link(PATIENT, PATIENT, '2026-10-05T09:00:00.000Z'),
    ).rejects.toThrow(/care_team_members_not_self_check/);
  });
});
