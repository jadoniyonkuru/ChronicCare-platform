import { Inject, Injectable } from '@nestjs/common';
import type { Selectable } from 'kysely';
import {
  DATABASE,
  type DatabaseClient,
  type DoseLogsTable,
} from '../database/database.types.js';
import { DoseLogQuery, DoseLogsRepository } from './dose-logs.repository.js';
import type { DoseLog } from './entities/dose-log.entity.js';

@Injectable()
export class PostgresDoseLogsRepository extends DoseLogsRepository {
  constructor(@Inject(DATABASE) private readonly db: DatabaseClient) {
    super();
  }

  async upsert(log: DoseLog): Promise<DoseLog> {
    const row = await this.db
      .insertInto('doseLogs')
      .values(log)
      .onConflict((oc) =>
        oc
          .columns(['medicationId', 'scheduledDate', 'scheduledTime'])
          .doUpdateSet((eb) => ({
            status: eb.ref('excluded.status'),
            takenAt: eb.ref('excluded.takenAt'),
            note: eb.ref('excluded.note'),
            updatedAt: eb.ref('excluded.updatedAt'),
          }))
          .where('doseLogs.patientId', '=', log.patientId),
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return toDoseLog(row);
  }

  async find(patientId: string, query: DoseLogQuery): Promise<DoseLog[]> {
    let select = this.db
      .selectFrom('doseLogs')
      .selectAll()
      .where('patientId', '=', patientId)
      .where('scheduledDate', '>=', query.from)
      .where('scheduledDate', '<=', query.to);

    if (query.medicationId !== undefined) {
      select = select.where('medicationId', '=', query.medicationId);
    }

    const rows = await select
      .orderBy('scheduledDate')
      .orderBy('scheduledTime')
      .execute();
    return rows.map(toDoseLog);
  }

  async delete(
    patientId: string,
    medicationId: string,
    scheduledDate: string,
    scheduledTime: string,
  ): Promise<boolean> {
    const result = await this.db
      .deleteFrom('doseLogs')
      .where('patientId', '=', patientId)
      .where('medicationId', '=', medicationId)
      .where('scheduledDate', '=', scheduledDate)
      .where('scheduledTime', '=', scheduledTime)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  }
}

function toDoseLog(row: Selectable<DoseLogsTable>): DoseLog {
  return {
    ...row,
    takenAt: row.takenAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
