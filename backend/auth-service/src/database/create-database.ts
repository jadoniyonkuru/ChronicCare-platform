import { CamelCasePlugin, Kysely, PostgresDialect } from 'kysely';
import { Migrator } from 'kysely/migration';
import pg from 'pg';
import type { Database, DatabaseClient } from './database.types.js';
import { migrationProvider } from './migrations/index.js';

export function createDatabase(connectionString: string): DatabaseClient {
  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new pg.Pool({ connectionString, max: 10 }),
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
      {
        cause: error,
      },
    );
  }
  return results.map((r) => r.migrationName);
}
