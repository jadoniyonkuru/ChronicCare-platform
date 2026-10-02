import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('email', 'varchar(254)', (col) => col.notNull().unique())
    .addColumn('full_name', 'varchar(100)', (col) => col.notNull())
    .addColumn('role', 'varchar(10)', (col) => col.notNull())
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    // The application lower-cases emails; enforce it so uniqueness holds.
    .addCheckConstraint(
      'users_email_lowercase_check',
      sql`email = lower(email)`,
    )
    .addCheckConstraint(
      'users_role_check',
      sql`role IN ('patient', 'provider')`,
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('users').execute();
}
