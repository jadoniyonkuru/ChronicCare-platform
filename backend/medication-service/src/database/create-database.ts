import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import { Migrator } from 'kysely/migration';
import pg from 'pg';
import type { Database, DatabaseClient } from './database.types.js';
import { migrationProvider } from './migrations/index.js';

const DATE_OID = 1082;

// Keep DATE values as "YYYY-MM-DD" strings. The default parser turns them
// into Date objects at local midnight, which shifts the day depending on the
// server's timezone.
const getTypeParser = ((oid: number, format?: 'text' | 'binary') =>
  oid === DATE_OID
    ? (value: string) => value
    : pg.types.getTypeParser(oid, format)) as typeof pg.types.getTypeParser;

export function createDatabase(connectionString: string): DatabaseClient {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({
        connectionString,
        max: 10,
        types: { getTypeParser },
      }),
    }),
    plugins: [new CamelCasePlugin()],
  });
}

/** Applies all pending migrations, throwing if any of them fails. */
export async function migrateToLatest(db: DatabaseClient): Promise<string[]> {
  const migrator = new Migrator({ db, provider: migrationProvider });
  const { error, results = [] } = await migrator.migrateToLatest();

  if (error) {
    const failed = results.find((r) => r.status === 'Error');
    throw new Error(
      `Migration ${failed?.migrationName ?? '(unknown)'} failed`,
      { cause: error },
    );
  }
  return results.map((r) => r.migrationName);
}
