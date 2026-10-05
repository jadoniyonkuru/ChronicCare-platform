import { Inject, Injectable } from '@nestjs/common';
import type { Selectable } from 'kysely';
import {
  type CareTeamMembersTable,
  DATABASE,
  type DatabaseClient,
} from '../database/database.types.js';
import { CareTeamRepository } from './care-team.repository.js';
import type { CareTeamMember } from './entities/care-team-member.entity.js';

@Injectable()
export class PostgresCareTeamRepository extends CareTeamRepository {
  constructor(@Inject(DATABASE) private readonly db: DatabaseClient) {
    super();
  }

  async add(member: CareTeamMember): Promise<CareTeamMember> {
    await this.db
      .insertInto('careTeamMembers')
      .values(member)
      .onConflict((oc) => oc.columns(['patientId', 'providerId']).doNothing())
      .execute();

    // Re-read so an existing link keeps its original addedAt.
    const row = await this.db
      .selectFrom('careTeamMembers')
      .selectAll()
      .where('patientId', '=', member.patientId)
      .where('providerId', '=', member.providerId)
      .executeTakeFirstOrThrow();
    return toMember(row);
  }

  async remove(patientId: string, providerId: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('careTeamMembers')
      .where('patientId', '=', patientId)
      .where('providerId', '=', providerId)
      .executeTakeFirst();
    return result.numDeletedRows > 0n;
  }

  async listForPatient(patientId: string): Promise<CareTeamMember[]> {
    const rows = await this.db
      .selectFrom('careTeamMembers')
      .selectAll()
      .where('patientId', '=', patientId)
      .orderBy('addedAt')
      .execute();
    return rows.map(toMember);
  }

  async listForProvider(providerId: string): Promise<CareTeamMember[]> {
    const rows = await this.db
      .selectFrom('careTeamMembers')
      .selectAll()
      .where('providerId', '=', providerId)
      .orderBy('addedAt')
      .execute();
    return rows.map(toMember);
  }

  async isMember(patientId: string, providerId: string): Promise<boolean> {
    const row = await this.db
      .selectFrom('careTeamMembers')
      .select('patientId')
      .where('patientId', '=', patientId)
      .where('providerId', '=', providerId)
      .executeTakeFirst();
    return row !== undefined;
  }
}

function toMember(row: Selectable<CareTeamMembersTable>): CareTeamMember {
  return { ...row, addedAt: row.addedAt.toISOString() };
}
