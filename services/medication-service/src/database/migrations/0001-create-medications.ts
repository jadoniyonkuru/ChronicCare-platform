import { Kysely, sql } from 'kysely';

// Migrations use Kysely<any> on purpose: they must keep working even after
// the Database interface changes in later migrations.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('medications')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('patient_id', 'uuid', (col) => col.notNull())
    .addColumn('name', 'varchar(100)', (col) => col.notNull())
    .addColumn('dosage', 'varchar(50)', (col) => col.notNull())
    .addColumn('times_of_day', sql`text[]`, (col) => col.notNull())
    .addColumn('instructions', 'varchar(500)')
    .addColumn('start_date', 'date', (col) => col.notNull())
    .addColumn('end_date', 'date')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addCheckConstraint(
      'medications_date_range_check',
      sql`end_date IS NULL OR end_date >= start_date`,
    )
    .addCheckConstraint(
      'medications_times_of_day_not_empty_check',
      sql`cardinality(times_of_day) BETWEEN 1 AND 12`,
    )
    .execute();

  await db.schema
    .createIndex('medications_patient_id_idx')
    .on('medications')
    .column('patient_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('medications').execute();
}
