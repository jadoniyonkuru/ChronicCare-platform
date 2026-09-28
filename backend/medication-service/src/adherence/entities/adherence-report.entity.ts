export class AdherenceCounts {
  /** Doses that were due: taken + skipped + missed. */
  due: number;
  /** Doses logged as taken. */
  taken: number;
  /** Doses logged as skipped. */
  skipped: number;
  /** Doses scheduled before today that were never logged. */
  missed: number;
  /** Doses scheduled today that are not logged yet; not counted as due. */
  pending: number;
  /** taken / due as a percentage with one decimal, or null if nothing was due. */
  adherencePercent: number | null;
}

export class MedicationAdherence extends AdherenceCounts {
  medicationId: string;
  name: string;
}

export class AdherenceReport extends AdherenceCounts {
  /** First date of the report, "YYYY-MM-DD". */
  from: string;
  /** Last date of the report, "YYYY-MM-DD". */
  to: string;
  /** Adherence per medication; the totals above are weighted by dose count. */
  medications: MedicationAdherence[];
}
