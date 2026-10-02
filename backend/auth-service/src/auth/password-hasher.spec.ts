import { DEFAULT_SCRYPT_PARAMS, PasswordHasher } from './password-hasher.js';

// A low cost keeps the tests fast; production uses DEFAULT_SCRYPT_PARAMS.
const FAST = { N: 2 ** 10, r: 8, p: 1 };

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher(FAST);

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hasher.hash('correct horse battery');

    await expect(hasher.verify('correct horse battery', hash)).resolves.toBe(
      true,
    );
    await expect(hasher.verify('correct horse batterY', hash)).resolves.toBe(
      false,
    );
  });

  it('never stores the password and salts every hash', async () => {
    const a = await hasher.hash('same password');
    const b = await hasher.hash('same password');

    expect(a).not.toContain('same password');
    expect(a).not.toBe(b);
    expect(a).toMatch(/^scrypt\$1024\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  });

  it('verifies hashes made with different cost parameters', async () => {
    const oldHash = await new PasswordHasher({ N: 2 ** 9, r: 8, p: 1 }).hash(
      'upgrade me',
    );

    await expect(hasher.verify('upgrade me', oldHash)).resolves.toBe(true);
  });

  it.each([
    ['empty', ''],
    ['wrong algorithm', 'bcrypt$10$abc$def$ghi$jkl'],
    ['missing parts', 'scrypt$1024$8$1$abc'],
    ['non-numeric cost', 'scrypt$x$8$1$YWJj$ZGVm'],
    ['short key', 'scrypt$1024$8$1$YWJj$ZGVm'],
  ])('rejects a malformed hash (%s) without throwing', async (_case, hash) => {
    await expect(hasher.verify('anything', hash)).resolves.toBe(false);
  });

  it('defaults to the OWASP minimum cost', () => {
    expect(DEFAULT_SCRYPT_PARAMS).toEqual({ N: 131072, r: 8, p: 1 });
  });
});
