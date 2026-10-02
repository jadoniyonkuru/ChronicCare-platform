export const ROLES = ['patient', 'provider'] as const;
export type Role = (typeof ROLES)[number];

/** A user as returned by the API. Never includes the password hash. */
export class User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

/** A user as stored, including the password hash. Never sent to clients. */
export interface UserRecord extends User {
  passwordHash: string;
}

export function toUser({ passwordHash: _hash, ...user }: UserRecord): User {
  return user;
}
