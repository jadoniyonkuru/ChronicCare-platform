/**
 * Creates demo accounts: a patient (with the same id as the demo patient in
 * medication-service, so their medication history matches) and a provider.
 * Safe to run repeatedly; it only replaces these two accounts.
 *
 * The passwords are public demo values. Never run this against a real
 * deployment.
 */
import { PasswordHasher } from '../auth/password-hasher.js';
import type { Role, UserRecord } from '../users/entities/user.entity.js';
import { PostgresUsersRepository } from '../users/postgres-users.repository.js';
import { createDatabase, migrateToLatest } from './create-database.js';

export const DEMO_PASSWORD = 'demo-password-2026';

const DEMO_USERS: Array<
  Pick<UserRecord, 'id' | 'email' | 'fullName'> & { role: Role }
> = [
  {
    id: '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01',
    email: 'patient@demo.chroniccare.dev',
    fullName: 'Ana Uwase',
    role: 'patient',
  },
  {
    id: '7b1d9e2f-3c4a-4b5d-8e6f-0a1b2c3d4e5f',
    email: 'provider@demo.chroniccare.dev',
    fullName: 'Dr. Eric Mugisha',
    role: 'provider',
  },
];

async function seed(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set; nothing to seed.');
  }

  const db = createDatabase(url);
  try {
    await migrateToLatest(db);
    const users = new PostgresUsersRepository(db);
    const hasher = new PasswordHasher();

    for (const demo of DEMO_USERS) {
      await db
        .deleteFrom('users')
        .where((eb) =>
          eb.or([eb('id', '=', demo.id), eb('email', '=', demo.email)]),
        )
        .execute();

      const now = new Date().toISOString();
      await users.create({
        ...demo,
        passwordHash: await hasher.hash(DEMO_PASSWORD),
        createdAt: now,
        updatedAt: now,
      });
      console.log(`  ${demo.role.padEnd(8)} ${demo.email}`);
    }
    console.log(`Seeded demo accounts (password: ${DEMO_PASSWORD})`);
  } finally {
    await db.destroy();
  }
}

await seed();
