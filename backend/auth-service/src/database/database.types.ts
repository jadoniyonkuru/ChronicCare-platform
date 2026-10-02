import type { ColumnType, Kysely } from 'kysely';
import type { Role } from '../users/entities/user.entity.js';

/**
 * Table shapes as seen from TypeScript. Column names are camelCase here and
 * snake_case in Postgres; CamelCasePlugin converts between them.
 */
export interface UsersTable {
  id: string;
  /** Always stored trimmed and lower-cased. */
  email: string;
  fullName: string;
  role: Role;
  passwordHash: string;
  createdAt: ColumnType<Date, string, string>;
  updatedAt: ColumnType<Date, string, string>;
}

export interface Database {
  users: UsersTable;
}

export type DatabaseClient = Kysely<Database>;

/** Injection token for the database client; null when running in-memory. */
export const DATABASE = Symbol('DATABASE');
