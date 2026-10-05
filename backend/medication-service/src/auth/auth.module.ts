import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { CareTeamModule } from '../care-team/care-team.module.js';
import { AccessTokenGuard, PatientAccessGuard } from './auth.guards.js';

const MIN_SECRET_LENGTH = 32;

/**
 * Verifies access tokens issued by auth-service and protects every route.
 * Guards run in the order listed: authenticate, then authorise.
 */
@Module({
  imports: [
    CareTeamModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.getOrThrow<string>('JWT_SECRET');
        if (secret.length < MIN_SECRET_LENGTH) {
          throw new Error(
            `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`,
          );
        }
        return { secret };
      },
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_GUARD, useClass: PatientAccessGuard },
  ],
})
export class AuthModule {}
