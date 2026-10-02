import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { toUser, type User } from '../users/entities/user.entity.js';
import { EmailTakenError, UsersRepository } from '../users/users.repository.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { AuthResponse } from './entities/auth-response.entity.js';
import { PasswordHasher } from './password-hasher.js';
import { TokensService } from './tokens.service.js';

const INVALID_CREDENTIALS = 'Invalid email or password';

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

@Injectable()
export class AuthService {
  /** Hash compared against when the email is unknown; see login(). */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UsersRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokensService,
  ) {}

  /** Creates a patient account. Providers are created by administrators. */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const now = new Date().toISOString();
    try {
      const user = await this.users.create({
        id: randomUUID(),
        email: normaliseEmail(dto.email),
        fullName: dto.fullName.trim(),
        role: 'patient',
        passwordHash: await this.hasher.hash(dto.password),
        createdAt: now,
        updatedAt: now,
      });
      return this.respond(toUser(user));
    } catch (error) {
      if (error instanceof EmailTakenError) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(normaliseEmail(dto.email));

    // Always run one hash comparison, so the response time does not reveal
    // whether the email is registered.
    const valid = await this.hasher.verify(
      dto.password,
      user?.passwordHash ?? (await this.getDummyHash()),
    );
    if (!user || !valid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    return this.respond(toUser(user));
  }

  async me(userId: string): Promise<User> {
    const user = await this.users.findById(userId);
    if (!user) {
      // The token is valid but the account no longer exists.
      throw new UnauthorizedException('Account not found');
    }
    return toUser(user);
  }

  private async respond(user: User): Promise<AuthResponse> {
    const { accessToken, expiresIn } = await this.tokens.issue(user);
    return { accessToken, tokenType: 'Bearer', expiresIn, user };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.hasher.hash(randomUUID());
    return this.dummyHash;
  }
}
