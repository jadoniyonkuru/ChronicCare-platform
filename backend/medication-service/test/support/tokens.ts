import { JwtService } from '@nestjs/jwt';
import {
  type Role,
  TOKEN_AUDIENCE,
  TOKEN_ISSUER,
} from '../../src/auth/auth.guards.js';

/** Same value as JWT_SECRET in the Vitest configs. */
export const TEST_JWT_SECRET = 'test-secret-that-is-at-least-32-characters';

/** Signs an access token the way auth-service does, for use in tests. */
export function accessToken(
  userId: string,
  role: Role = 'patient',
  options: { secret?: string; expiresIn?: number } = {},
): string {
  return new JwtService({ secret: options.secret ?? TEST_JWT_SECRET }).sign(
    { role },
    {
      subject: userId,
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      expiresIn: options.expiresIn ?? 3600,
    },
  );
}

/** `Authorization` header value for a user. */
export function bearer(userId: string, role: Role = 'patient'): string {
  return `Bearer ${accessToken(userId, role)}`;
}
