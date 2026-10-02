import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

/** Must match the tokens issued by auth-service (see ADR 0004). */
export const TOKEN_ISSUER = 'chroniccare-auth';
export const TOKEN_AUDIENCE = 'chroniccare-api';

export type Role = 'patient' | 'provider';

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

const IS_PUBLIC = 'isPublic';

/** Marks a route (or controller) as reachable without an access token. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** The user authenticated by AccessTokenGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user!,
);

/**
 * Applied globally: every route needs a valid access token from auth-service
 * unless marked @Public().
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const claims = await this.jwt.verifyAsync<{ sub: string; role: Role }>(
        token,
        {
          issuer: TOKEN_ISSUER,
          audience: TOKEN_AUDIENCE,
          algorithms: ['HS256'],
        },
      );
      request.user = { id: claims.sub, role: claims.role };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

const READ_METHODS = new Set(['GET', 'HEAD']);

/**
 * Applied globally after AccessTokenGuard, to every route with a :patientId:
 * - a patient may only access their own data;
 * - a provider may read any patient's data but not change it.
 *
 * Provider access will be narrowed to the provider's own patients once care
 * teams exist (see the roadmap).
 */
@Injectable()
export class PatientAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const patientId = request.params?.patientId;
    const user = request.user;
    if (patientId === undefined || user === undefined) return true;

    if (user.role === 'patient' && user.id === patientId) return true;
    if (user.role === 'provider' && READ_METHODS.has(request.method)) {
      return true;
    }
    throw new ForbiddenException(
      "You do not have access to this patient's data",
    );
  }
}
