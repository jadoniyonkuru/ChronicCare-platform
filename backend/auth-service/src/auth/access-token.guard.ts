import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Role } from '../users/entities/user.entity.js';
import { TokensService } from './tokens.service.js';

export interface AuthenticatedUser {
  id: string;
  role: Role;
}

type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

/** Requires a valid `Authorization: Bearer <access token>` header. */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly tokens: TokensService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const claims = await this.tokens.verify(token);
      request.user = { id: claims.sub, role: claims.role };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

/** The user authenticated by AccessTokenGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user!,
);
