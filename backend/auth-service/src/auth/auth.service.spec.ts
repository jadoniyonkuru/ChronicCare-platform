import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InMemoryUsersRepository } from '../users/users.repository.js';
import { AuthService, normaliseEmail } from './auth.service.js';
import { PasswordHasher } from './password-hasher.js';
import { TokensService } from './tokens.service.js';

const SECRET = 'test-secret-that-is-at-least-32-characters';

describe('AuthService', () => {
  let auth: AuthService;
  let users: InMemoryUsersRepository;
  let tokens: TokensService;

  const register = (overrides = {}) =>
    auth.register({
      email: 'Ana.Uwase@Example.com ',
      password: 'a long passphrase',
      fullName: ' Ana Uwase ',
      ...overrides,
    });

  beforeEach(() => {
    users = new InMemoryUsersRepository();
    tokens = new TokensService(new JwtService({ secret: SECRET }), 3600);
    auth = new AuthService(
      users,
      new PasswordHasher({ N: 2 ** 10, r: 8, p: 1 }),
      tokens,
    );
  });

  describe('register', () => {
    it('creates a normalised patient account and returns a token', async () => {
      const res = await register();

      expect(res).toMatchObject({
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          email: 'ana.uwase@example.com',
          fullName: 'Ana Uwase',
          role: 'patient',
        },
      });
      await expect(tokens.verify(res.accessToken)).resolves.toEqual({
        sub: res.user.id,
        role: 'patient',
      });
    });

    it('never returns or stores the plain password', async () => {
      const res = await register();
      const stored = await users.findById(res.user.id);

      expect(res.user).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(res)).not.toContain('a long passphrase');
      expect(stored?.passwordHash).toMatch(/^scrypt\$/);
    });

    it('rejects an email that is already registered, in any letter case', async () => {
      await register();

      await expect(
        register({ email: 'ANA.UWASE@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await register();
    });

    it('returns a token for the right password, ignoring email case', async () => {
      const res = await auth.login({
        email: 'ANA.UWASE@EXAMPLE.COM',
        password: 'a long passphrase',
      });

      expect(res.user.email).toBe('ana.uwase@example.com');
      await expect(tokens.verify(res.accessToken)).resolves.toMatchObject({
        role: 'patient',
      });
    });

    it('gives the same error for a wrong password and an unknown email', async () => {
      const wrongPassword = auth.login({
        email: 'ana.uwase@example.com',
        password: 'not the passphrase',
      });
      const unknownEmail = auth.login({
        email: 'nobody@example.com',
        password: 'a long passphrase',
      });

      const errors = await Promise.all(
        [wrongPassword, unknownEmail].map((p) =>
          p.then(
            () => undefined,
            (e: unknown) => e,
          ),
        ),
      );
      for (const error of errors) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as Error).message).toBe('Invalid email or password');
      }
    });
  });

  describe('me', () => {
    it('returns the account for a user id', async () => {
      const { user } = await register();

      await expect(auth.me(user.id)).resolves.toEqual(user);
    });

    it('rejects a token for an account that no longer exists', async () => {
      await expect(
        auth.me('00000000-0000-4000-8000-000000000000'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  it('normalises emails by trimming and lower-casing', () => {
    expect(normaliseEmail('  Ana@Example.COM ')).toBe('ana@example.com');
  });
});
