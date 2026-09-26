import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('dose_logs')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('medication_id', 'uuid', (col) =>
      col.notNull().references('medications.id').onDelete('cascade'),
    )
    .addColumn('patient_id', 'uuid', (col) => col.notNull())
    .addColumn('scheduled_date', 'date', (col) => col.notNull())
    .addColumn('scheduled_time', 'varchar(5)', (col) => col.notNull())
    .addColumn('status', 'varchar(10)', (col) => col.notNull())
    .addColumn('taken_at', 'timestamptz')
    .addColumn('note', 'varchar(500)')
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    // One log per scheduled dose; logging again updates it.
    .addUniqueConstraint('dose_logs_slot_unique', [
      'medication_id',
      'scheduled_date',
      'scheduled_time',
    ])
    .addCheckConstraint(
      'dose_logs_status_check',
      sql`status IN ('taken', 'skipped')`,
    )
    .addCheckConstraint(
      'dose_logs_taken_at_check',
      sql`status = 'taken' OR taken_at IS NULL`,
    )
    .addCheckConstraint(
      'dose_logs_scheduled_time_check',
      sql`scheduled_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`,
    )
    .execute();

  // Adherence reads all of a patient's logs for a date range.
  await db.schema
    .createIndex('dose_logs_patient_date_idx')
    .on('dose_logs')
    .columns(['patient_id', 'scheduled_date'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('dose_logs').execute();
}
