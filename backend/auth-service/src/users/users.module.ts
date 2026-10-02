import { Module } from '@nestjs/common';
import { DATABASE, type DatabaseClient } from '../database/database.types.js';
import { PostgresUsersRepository } from './postgres-users.repository.js';
import {
  InMemoryUsersRepository,
  UsersRepository,
} from './users.repository.js';

@Module({
  providers: [
    {
      provide: UsersRepository,
      inject: [DATABASE],
      useFactory: (db: DatabaseClient | null): UsersRepository =>
        db ? new PostgresUsersRepository(db) : new InMemoryUsersRepository(),
    },
  ],
  exports: [UsersRepository],
})
export class UsersModule {}
