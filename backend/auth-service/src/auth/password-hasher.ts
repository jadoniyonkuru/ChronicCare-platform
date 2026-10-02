import { Injectable } from '@nestjs/common';
import {
  randomBytes,
  scrypt,
  type ScryptOptions,
  timingSafeEqual,
} from 'node:crypto';

export interface ScryptParams {
  /** CPU/memory cost; must be a power of two. */
  N: number;
  r: number;
  p: number;
}

/** OWASP's recommended minimum for scrypt: N=2^17 (128 MiB), r=8, p=1. */
export const DEFAULT_SCRYPT_PARAMS: ScryptParams = { N: 2 ** 17, r: 8, p: 1 };

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function deriveKey(
  password: string,
  salt: Buffer,
  { N, r, p }: ScryptParams,
): Promise<Buffer> {
  const options: ScryptOptions = {
    N,
    r,
    p,
    // scrypt needs 128 * N * r bytes; allow that plus headroom.
    maxmem: 256 * N * r,
  };
  return new Promise((resolve, reject) =>
    scrypt(password, salt, KEY_LENGTH, options, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

/**
 * Hashes passwords with scrypt. Hashes are self-describing
 * ("scrypt$N$r$p$salt$key", base64 salt and key), so the cost can be raised
 * later while existing hashes keep verifying.
 */
@Injectable()
export class PasswordHasher {
  constructor(private readonly params: ScryptParams = DEFAULT_SCRYPT_PARAMS) {}

  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const key = await deriveKey(password, salt, this.params);
    const { N, r, p } = this.params;
    return [
      'scrypt',
      N,
      r,
      p,
      salt.toString('base64'),
      key.toString('base64'),
    ].join('$');
  }

  /** Returns false (never throws) for wrong passwords and malformed hashes. */
  async verify(password: string, stored: string): Promise<boolean> {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

    const [N, r, p] = parts.slice(1, 4).map(Number);
    if (![N, r, p].every((n) => Number.isInteger(n) && n > 0)) return false;

    const salt = Buffer.from(parts[4], 'base64');
    const expected = Buffer.from(parts[5], 'base64');
    if (expected.length !== KEY_LENGTH) return false;

    try {
      const actual = await deriveKey(password, salt, { N, r, p });
      return timingSafeEqual(actual, expected);
    } catch {
      return false;
    }
  }
}
