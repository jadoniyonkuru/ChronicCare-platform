import { Inject, Injectable } from '@nestjs/common';
import type { Selectable } from 'kysely';
import {
  DATABASE,
  type DatabaseClient,
  type UsersTable,
} from '../database/database.types.js';
import type { UserRecord } from './entities/user.entity.js';
import { EmailTakenError, UsersRepository } from './users.repository.js';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class PostgresUsersRepository extends UsersRepository {
  constructor(@Inject(DATABASE) private readonly db: DatabaseClient) {
    super();
  }

  async create(user: UserRecord): Promise<UserRecord> {
    try {
      const row = await this.db
        .insertInto('users')
        .values(user)
        .returningAll()
        .executeTakeFirstOrThrow();
      return toUserRecord(row);
    } catch (error) {
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new EmailTakenError(user.email);
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
    return row && toUserRecord(row);
  }

  async findById(id: string): Promise<UserRecord | undefined> {
    const row = await this.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row && toUserRecord(row);
  }
}

function toUserRecord(row: Selectable<UsersTable>): UserRecord {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
