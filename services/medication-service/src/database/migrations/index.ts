import type { Migration, MigrationProvider } from 'kysely/migration';
import * as m0001 from './0001-create-medications.js';

/**
 * Migrations are registered explicitly instead of read from disk, so they
 * work the same from TypeScript sources (tests) and compiled output (dist).
 * Names sort in execution order; never rename or edit an applied migration.
 */
const migrations: Record<string, Migration> = {
  '0001-create-medications': m0001,
};

export const migrationProvider: MigrationProvider = {
  getMigrations: async () => migrations,
};
