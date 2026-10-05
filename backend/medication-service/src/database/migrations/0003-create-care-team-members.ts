import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('care_team_members')
    .addColumn('patient_id', 'uuid', (col) => col.notNull())
    .addColumn('provider_id', 'uuid', (col) => col.notNull())
    .addColumn('added_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addPrimaryKeyConstraint('care_team_members_pkey', [
      'patient_id',
      'provider_id',
    ])
    .addCheckConstraint(
      'care_team_members_not_self_check',
      sql`patient_id <> provider_id`,
    )
    .execute();

  // Providers list their patients; the primary key already covers lookups
  // by patient.
  await db.schema
    .createIndex('care_team_members_provider_id_idx')
    .on('care_team_members')
    .column('provider_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('care_team_members').execute();
}
