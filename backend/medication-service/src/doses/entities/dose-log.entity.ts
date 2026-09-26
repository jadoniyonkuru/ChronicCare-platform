export const DOSE_STATUSES = ['taken', 'skipped'] as const;
export type DoseStatus = (typeof DOSE_STATUSES)[number];

/** What happened to one scheduled dose of a medication. */
export interface DoseLog {
  id: string;
  medicationId: string;
  patientId: string;
  /** The day the dose was scheduled for, "YYYY-MM-DD". */
  scheduledDate: string;
  /** The scheduled time, "HH:mm"; one of the medication's timesOfDay. */
  scheduledTime: string;
  status: DoseStatus;
  /** When the dose was actually taken (ISO 8601); null when skipped. */
  takenAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}
