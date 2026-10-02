import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Role, User } from '../users/entities/user.entity.js';

/** Token contract shared with every service that verifies access tokens. */
export const TOKEN_ISSUER = 'chroniccare-auth';
export const TOKEN_AUDIENCE = 'chroniccare-api';

export interface AccessTokenClaims {
  sub: string;
  role: Role;
}

export interface IssuedToken {
  accessToken: string;
  /** Lifetime in seconds. */
  expiresIn: number;
}

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly expiresInSeconds: number,
  ) {}

  async issue(user: Pick<User, 'id' | 'role'>): Promise<IssuedToken> {
    const accessToken = await this.jwt.signAsync(
      { role: user.role },
      {
        subject: user.id,
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
        expiresIn: this.expiresInSeconds,
        algorithm: 'HS256',
      },
    );
    return { accessToken, expiresIn: this.expiresInSeconds };
  }

  /** @throws if the token is invalid, expired, or not one of ours. */
  async verify(token: string): Promise<AccessTokenClaims> {
    const claims = await this.jwt.verifyAsync<AccessTokenClaims>(token, {
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      algorithms: ['HS256'],
    });
    return { sub: claims.sub, role: claims.role };
  }
}
