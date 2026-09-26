import { Injectable } from '@nestjs/common';
import type { DoseLog } from './entities/dose-log.entity.js';

export interface DoseLogQuery {
  /** First scheduled date to include, "YYYY-MM-DD". */
  from: string;
  /** Last scheduled date to include, "YYYY-MM-DD". */
  to: string;
  /** Limit to one medication; all of the patient's medications if omitted. */
  medicationId?: string;
}

/** Storage boundary for dose logs. A log is identified by its dose slot. */
export abstract class DoseLogsRepository {
  /**
   * Inserts the log, or updates the existing log for the same medication,
   * date and time (keeping its id and createdAt).
   */
  abstract upsert(log: DoseLog): Promise<DoseLog>;
  /** Logs sorted by scheduled date, then time. */
  abstract find(patientId: string, query: DoseLogQuery): Promise<DoseLog[]>;
  abstract delete(
    patientId: string,
    medicationId: string,
    scheduledDate: string,
    scheduledTime: string,
  ): Promise<boolean>;
}

@Injectable()
export class InMemoryDoseLogsRepository extends DoseLogsRepository {
  private readonly logs = new Map<string, DoseLog>();

  async upsert(log: DoseLog): Promise<DoseLog> {
    const key = slotKey(log.medicationId, log.scheduledDate, log.scheduledTime);
    const existing = this.logs.get(key);
    if (existing && existing.patientId !== log.patientId) {
      throw new Error('Dose slot belongs to another patient');
    }
    const stored: DoseLog = existing
      ? { ...log, id: existing.id, createdAt: existing.createdAt }
      : log;
    this.logs.set(key, structuredClone(stored));
    return structuredClone(stored);
  }

  async find(patientId: string, query: DoseLogQuery): Promise<DoseLog[]> {
    return [...this.logs.values()]
      .filter(
        (log) =>
          log.patientId === patientId &&
          log.scheduledDate >= query.from &&
          log.scheduledDate <= query.to &&
          (query.medicationId === undefined ||
            log.medicationId === query.medicationId),
      )
      .sort(
        (a, b) =>
          a.scheduledDate.localeCompare(b.scheduledDate) ||
          a.scheduledTime.localeCompare(b.scheduledTime),
      )
      .map((log) => structuredClone(log));
  }

  async delete(
    patientId: string,
    medicationId: string,
    scheduledDate: string,
    scheduledTime: string,
  ): Promise<boolean> {
    const key = slotKey(medicationId, scheduledDate, scheduledTime);
    if (this.logs.get(key)?.patientId !== patientId) return false;
    return this.logs.delete(key);
  }
}

function slotKey(medicationId: string, date: string, time: string): string {
  return `${medicationId}|${date}|${time}`;
}
