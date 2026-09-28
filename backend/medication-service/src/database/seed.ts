/**
 * Fills the database with a demo patient: three medications and 30 days of
 * dose history. Safe to run repeatedly; it only replaces the demo patient's
 * data. Run with `npm run db:seed` (or inside Docker, see the README).
 */
import { randomUUID } from 'node:crypto';
import { calculateAdherence } from '../adherence/calculate-adherence.js';
import { addDays, toDateString } from '../common/dates.js';
import type { DoseLog } from '../doses/entities/dose-log.entity.js';
import { PostgresDoseLogsRepository } from '../doses/postgres-dose-logs.repository.js';
import type { Medication } from '../medications/entities/medication.entity.js';
import { PostgresMedicationsRepository } from '../medications/postgres-medications.repository.js';
import { createDatabase, migrateToLatest } from './create-database.js';

export const DEMO_PATIENT_ID = '5f0c7a1e-8a51-4a8e-9a4b-1f7c3a2b9d01';
const HISTORY_DAYS = 30;

const DEMO_MEDICATIONS = [
  {
    name: 'Metformin',
    dosage: '500 mg',
    timesOfDay: ['08:00', '20:00'],
    instructions: 'Take with meals',
    // Evening doses are the ones most often forgotten.
    takeRate: { '08:00': 0.95, '20:00': 0.75 },
  },
  {
    name: 'Lisinopril',
    dosage: '10 mg',
    timesOfDay: ['08:00'],
    instructions: 'For blood pressure',
    takeRate: { '08:00': 0.93 },
  },
  {
    name: 'Atorvastatin',
    dosage: '20 mg',
    timesOfDay: ['21:00'],
    instructions: 'For cholesterol, in the evening',
    takeRate: { '21:00': 0.8 },
  },
] as const;

/** Small deterministic PRNG so every run produces the same history. */
function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function seed(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set; nothing to seed.');
  }

  const db = createDatabase(url);
  try {
    await migrateToLatest(db);
    const medications = new PostgresMedicationsRepository(db);
    const doseLogs = new PostgresDoseLogsRepository(db);

    // Dose logs are removed with their medications (ON DELETE CASCADE).
    await db
      .deleteFrom('medications')
      .where('patientId', '=', DEMO_PATIENT_ID)
      .execute();

    const today = toDateString(new Date());
    const startDate = addDays(today, -HISTORY_DAYS);
    const random = mulberry32(2026);
    const created: Medication[] = [];
    const logs: DoseLog[] = [];

    for (const demo of DEMO_MEDICATIONS) {
      const now = new Date().toISOString();
      const medication = await medications.save({
        id: randomUUID(),
        patientId: DEMO_PATIENT_ID,
        name: demo.name,
        dosage: demo.dosage,
        timesOfDay: [...demo.timesOfDay],
        instructions: demo.instructions,
        startDate,
        endDate: null,
        createdAt: now,
        updatedAt: now,
      });
      created.push(medication);

      // History up to yesterday; today's doses are left for the demo.
      for (let date = startDate; date < today; date = addDays(date, 1)) {
        for (const time of demo.timesOfDay) {
          const roll = random();
          const takeRate: number =
            demo.takeRate[time as keyof typeof demo.takeRate];
          // Most non-taken doses are simply forgotten (missed, no log);
          // some are explicitly skipped.
          if (roll >= takeRate && roll < takeRate + (1 - takeRate) * 0.6) {
            continue;
          }
          const status = roll < takeRate ? 'taken' : 'skipped';
          const minutesLate = Math.floor(random() * 45);
          const takenAt =
            status === 'taken'
              ? new Date(
                  Date.parse(`${date}T${time}:00Z`) + minutesLate * 60_000,
                ).toISOString()
              : null;
          logs.push(
            await doseLogs.upsert({
              id: randomUUID(),
              medicationId: medication.id,
              patientId: DEMO_PATIENT_ID,
              scheduledDate: date,
              scheduledTime: time,
              status,
              takenAt,
              note: status === 'skipped' ? 'Felt unwell' : null,
              createdAt: takenAt ?? `${date}T${time}:00.000Z`,
              updatedAt: takenAt ?? `${date}T${time}:00.000Z`,
            }),
          );
        }
      }
    }

    const report = calculateAdherence({
      medications: created,
      logs,
      from: startDate,
      to: today,
      today,
    });
    console.log(`Seeded demo patient ${DEMO_PATIENT_ID}`);
    for (const m of report.medications) {
      console.log(
        `  ${m.name.padEnd(13)} ${String(m.adherencePercent).padStart(5)}%  (${m.taken} taken, ${m.skipped} skipped, ${m.missed} missed)`,
      );
    }
    console.log(`  Overall       ${report.adherencePercent}%`);
  } finally {
    await db.destroy();
  }
}

await seed();
