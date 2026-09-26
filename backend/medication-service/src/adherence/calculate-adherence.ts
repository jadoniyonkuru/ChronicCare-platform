import { addDays, daysInclusive, maxDate, minDate } from '../common/dates.js';
import type { DoseLog } from '../doses/entities/dose-log.entity.js';
import type { Medication } from '../medications/entities/medication.entity.js';

export interface AdherenceCounts {
  /** Doses that were due: taken + skipped + missed. */
  due: number;
  taken: number;
  skipped: number;
  /** Doses scheduled before today that were never logged. */
  missed: number;
  /** Doses scheduled today that are not logged yet; not counted as due. */
  pending: number;
  /** taken / due as a percentage with one decimal, or null if nothing was due. */
  adherencePercent: number | null;
}

export interface MedicationAdherence extends AdherenceCounts {
  medicationId: string;
  name: string;
}

export interface AdherenceReport extends AdherenceCounts {
  from: string;
  to: string;
  medications: MedicationAdherence[];
}

export interface AdherenceInput {
  medications: Medication[];
  /** The patient's dose logs within [from, to]. */
  logs: DoseLog[];
  from: string;
  to: string;
  today: string;
}

/**
 * Medication adherence over a date range: the share of due doses that were
 * taken. Skipped and missed doses both count against adherence. Days after
 * today are ignored, and today's doses only count once they are logged, so a
 * patient is not penalised for an evening dose in the morning.
 *
 * Uses each medication's current schedule for the whole range.
 */
export function calculateAdherence(input: AdherenceInput): AdherenceReport {
  const medications = input.medications.map((medication) =>
    medicationAdherence(medication, input),
  );

  const totals = medications.reduce(
    (sum, m) => ({
      due: sum.due + m.due,
      taken: sum.taken + m.taken,
      skipped: sum.skipped + m.skipped,
      missed: sum.missed + m.missed,
      pending: sum.pending + m.pending,
    }),
    { due: 0, taken: 0, skipped: 0, missed: 0, pending: 0 },
  );

  return {
    from: input.from,
    to: input.to,
    ...totals,
    adherencePercent: percent(totals.taken, totals.due),
    medications,
  };
}

function medicationAdherence(
  medication: Medication,
  { logs, from, to, today }: AdherenceInput,
): MedicationAdherence {
  const start = maxDate(from, medication.startDate);
  const end = minDate(to, medication.endDate ?? to, today);
  const dosesPerDay = medication.timesOfDay.length;
  const scheduledTimes = new Set(medication.timesOfDay);

  const relevant =
    start > end
      ? []
      : logs.filter(
          (log) =>
            log.medicationId === medication.id &&
            log.scheduledDate >= start &&
            log.scheduledDate <= end &&
            scheduledTimes.has(log.scheduledTime),
        );

  const pastSlots =
    daysInclusive(start, minDate(end, addDays(today, -1))) * dosesPerDay;
  const todaySlots = start <= end && end === today ? dosesPerDay : 0;
  const loggedToday = relevant.filter((l) => l.scheduledDate === today).length;
  const loggedBeforeToday = relevant.length - loggedToday;

  const taken = relevant.filter((l) => l.status === 'taken').length;
  const skipped = relevant.length - taken;
  const missed = pastSlots - loggedBeforeToday;
  const due = taken + skipped + missed;

  return {
    medicationId: medication.id,
    name: medication.name,
    due,
    taken,
    skipped,
    missed,
    pending: todaySlots - loggedToday,
    adherencePercent: percent(taken, due),
  };
}

function percent(part: number, whole: number): number | null {
  return whole === 0 ? null : Math.round((part / whole) * 1000) / 10;
}
