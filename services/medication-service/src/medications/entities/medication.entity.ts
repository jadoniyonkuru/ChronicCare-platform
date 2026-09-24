export interface Medication {
  id: string;
  patientId: string;
  name: string;
  /** Free text as written on the prescription, e.g. "500 mg" or "2 puffs". */
  dosage: string;
  /** Daily dose times in 24h "HH:mm" format, sorted ascending. */
  timesOfDay: string[];
  instructions: string | null;
  /** First day of treatment, "YYYY-MM-DD". */
  startDate: string;
  /** Last day of treatment, "YYYY-MM-DD", or null for ongoing medication. */
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}
