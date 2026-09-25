import { Inject, Injectable } from '@nestjs/common';
import type { Selectable } from 'kysely';
import {
  DATABASE,
  type DatabaseClient,
  type MedicationsTable,
} from '../database/database.types.js';
import type { Medication } from './entities/medication.entity.js';
import { MedicationsRepository } from './medications.repository.js';

@Injectable()
export class PostgresMedicationsRepository extends MedicationsRepository {
  constructor(@Inject(DATABASE) private readonly db: DatabaseClient) {
    super();
  }

  async save(medication: Medication): Promise<Medication> {
    const row = await this.db
      .insertInto('medications')
      .values(medication)
      .onConflict((oc) =>
        oc
          .column('id')
          .doUpdateSet((eb) => ({
            name: eb.ref('excluded.name'),
            dosage: eb.ref('excluded.dosage'),
            timesOfDay: eb.ref('excluded.timesOfDay'),
            instructions: eb.ref('excluded.instructions'),
            startDate: eb.ref('excluded.startDate'),
            endDate: eb.ref('excluded.endDate'),
            updatedAt: eb.ref('excluded.updatedAt'),
          }))
          // Never let an update move a medication to another patient.
          .where('medications.patientId', '=', medication.patientId),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return toMedication(row);
  }

  async findByPatient(patientId: string): Promise<Medication[]> {
    const rows = await this.db
      .selectFrom('medications')
      .selectAll()
      .where('patientId', '=', patientId)
      .orderBy('name')
      .execute();

    return rows.map(toMedication);
  }

  async findOne(
    patientId: string,
    id: string,
  ): Promise<Medication | undefined> {
    const row = await this.db
      .selectFrom('medications')
      .selectAll()
      .where('id', '=', id)
      .where('patientId', '=', patientId)
      .executeTakeFirst();

    return row && toMedication(row);
  }

  async delete(patientId: string, id: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('medications')
      .where('id', '=', id)
      .where('patientId', '=', patientId)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  }
}

function toMedication(row: Selectable<MedicationsTable>): Medication {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
