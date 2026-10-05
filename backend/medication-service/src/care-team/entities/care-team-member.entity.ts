/** A provider the patient has allowed to read their medication data. */
export class CareTeamMember {
  patientId: string;
  providerId: string;
  /** When the patient added the provider (ISO 8601). */
  addedAt: string;
}
