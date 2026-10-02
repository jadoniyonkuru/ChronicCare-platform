import { randomUUID } from 'node:crypto';
import {
  createDatabase,
  migrateToLatest,
} from '../src/database/create-database.js';
import type { DatabaseClient } from '../src/database/database.types.js';
import type { UserRecord } from '../src/users/entities/user.entity.js';
import { PostgresUsersRepository } from '../src/users/postgres-users.repository.js';
import { EmailTakenError } from '../src/users/users.repository.js';

function user(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: randomUUID(),
    email: 'ana@example.com',
    fullName: 'Ana Uwase',
    role: 'patient',
    passwordHash: 'scrypt$1024$8$1$c2FsdA==$a2V5',
    createdAt: '2026-10-02T08:00:00.000Z',
    updatedAt: '2026-10-02T08:00:00.000Z',
    ...overrides,
  };
}

describe('PostgresUsersRepository (integration)', () => {
  let db: DatabaseClient;
  let repository: PostgresUsersRepository;

  beforeAll(async () => {
    const url = process.env.TEST_DATABASE_URL;
    if (!url) {
      throw new Error(
        'TEST_DATABASE_URL is not set. Start Postgres with `docker compose up -d postgres` and see .env.example.',
      );
    }
    db = createDatabase(url);
    await migrateToLatest(db);
    repository = new PostgresUsersRepository(db);
  });

  beforeEach(async () => {
    await db.deleteFrom('users').execute();
  });

  afterAll(async () => {
    await db?.destroy();
  });

  it('is a no-op to migrate an up-to-date database', async () => {
    await expect(migrateToLatest(db)).resolves.toEqual([]);
  });

  it('round-trips every field without changing it', async () => {
    const original = user();

    await expect(repository.create(original)).resolves.toEqual(original);
    await expect(repository.findById(original.id)).resolves.toEqual(original);
    await expect(repository.findByEmail(original.email)).resolves.toEqual(
      original,
    );
  });

  it('reports a duplicate email as EmailTakenError', async () => {
    await repository.create(user());

    await expect(repository.create(user())).rejects.toThrow(EmailTakenError);
  });

  it('returns undefined for unknown users', async () => {
    await expect(repository.findById(randomUUID())).resolves.toBeUndefined();
    await expect(
      repository.findByEmail('nobody@example.com'),
    ).resolves.toBeUndefined();
  });

  it('rejects emails that are not lower-cased', async () => {
    await expect(
      repository.create(user({ email: 'Ana@Example.com' })),
    ).rejects.toThrow(/users_email_lowercase_check/);
  });

  it('rejects unknown roles', async () => {
    await expect(
      repository.create(user({ role: 'admin' as UserRecord['role'] })),
    ).rejects.toThrow(/users_role_check/);
  });
});
