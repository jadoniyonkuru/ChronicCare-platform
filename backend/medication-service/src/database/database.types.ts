import type { ColumnType, Kysely } from 'kysely';

/**
 * Table shapes as seen from TypeScript. Column names are camelCase here and
 * snake_case in Postgres; CamelCasePlugin converts between them.
 */
export interface MedicationsTable {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  timesOfDay: string[];
  instructions: string | null;
  /** DATE columns are returned as "YYYY-MM-DD" strings (see create-database.ts). */
  startDate: string;
  endDate: string | null;
  createdAt: ColumnType<Date, string, string>;
  updatedAt: ColumnType<Date, string, string>;
}

export interface DoseLogsTable {
  id: string;
  medicationId: string;
  patientId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'taken' | 'skipped';
  takenAt: ColumnType<Date | null, string | null, string | null>;
  note: string | null;
  createdAt: ColumnType<Date, string, string>;
  updatedAt: ColumnType<Date, string, string>;
}

export interface Database {
  medications: MedicationsTable;
  doseLogs: DoseLogsTable;
}

export type DatabaseClient = Kysely<Database>;

/** Injection token for the database client; null when running in-memory. */
export const DATABASE = Symbol('DATABASE');
