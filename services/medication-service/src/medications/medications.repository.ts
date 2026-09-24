import { Injectable } from '@nestjs/common';
import type { Medication } from './entities/medication.entity.js';

/**
 * Storage boundary for medications. The service depends on this abstract
 * class only, so the in-memory implementation can be swapped for a database
 * one without touching business logic.
 */
export abstract class MedicationsRepository {
  abstract save(medication: Medication): Promise<Medication>;
  abstract findByPatient(patientId: string): Promise<Medication[]>;
  abstract findOne(
    patientId: string,
    id: string,
  ): Promise<Medication | undefined>;
  abstract delete(patientId: string, id: string): Promise<boolean>;
}

@Injectable()
export class InMemoryMedicationsRepository extends MedicationsRepository {
  private readonly medications = new Map<string, Medication>();

  async save(medication: Medication): Promise<Medication> {
    this.medications.set(medication.id, structuredClone(medication));
    return structuredClone(medication);
  }

  async findByPatient(patientId: string): Promise<Medication[]> {
    return [...this.medications.values()]
      .filter((m) => m.patientId === patientId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((m) => structuredClone(m));
  }

  async findOne(
    patientId: string,
    id: string,
  ): Promise<Medication | undefined> {
    const medication = this.medications.get(id);
    if (!medication || medication.patientId !== patientId) return undefined;
    return structuredClone(medication);
  }

  async delete(patientId: string, id: string): Promise<boolean> {
    if (!(await this.findOne(patientId, id))) return false;
    return this.medications.delete(id);
  }
}
