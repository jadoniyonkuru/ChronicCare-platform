import { Injectable } from '@nestjs/common';
import type { UserRecord } from './entities/user.entity.js';

/** Thrown by `create` when the email is already registered. */
export class EmailTakenError extends Error {
  constructor(email: string) {
    super(`Email already registered: ${email}`);
  }
}

/** Storage boundary for users. Emails are expected to be normalised. */
export abstract class UsersRepository {
  /** @throws EmailTakenError if the email is already registered. */
  abstract create(user: UserRecord): Promise<UserRecord>;
  abstract findByEmail(email: string): Promise<UserRecord | undefined>;
  abstract findById(id: string): Promise<UserRecord | undefined>;
}

@Injectable()
export class InMemoryUsersRepository extends UsersRepository {
  private readonly users = new Map<string, UserRecord>();

  async create(user: UserRecord): Promise<UserRecord> {
    if (await this.findByEmail(user.email))
      throw new EmailTakenError(user.email);
    this.users.set(user.id, structuredClone(user));
    return structuredClone(user);
  }

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const user = [...this.users.values()].find((u) => u.email === email);
    return user && structuredClone(user);
  }

  async findById(id: string): Promise<UserRecord | undefined> {
    const user = this.users.get(id);
    return user && structuredClone(user);
  }
}
