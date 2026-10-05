import type { Migration, MigrationProvider } from 'kysely/migration';
import * as m0001 from './0001-create-medications.js';
import * as m0002 from './0002-create-dose-logs.js';
import * as m0003 from './0003-create-care-team-members.js';

/**
 * Migrations are registered explicitly instead of read from disk, so they
 * work the same from TypeScript sources (tests) and compiled output (dist).
 * Names sort in execution order; never rename or edit an applied migration.
 */
const migrations: Record<string, Migration> = {
  '0001-create-medications': m0001,
  '0002-create-dose-logs': m0002,
  '0003-create-care-team-members': m0003,
};

export const migrationProvider: MigrationProvider = {
  getMigrations: async () => migrations,
};
