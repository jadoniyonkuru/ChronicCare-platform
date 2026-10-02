import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { UsersModule } from '../users/users.module.js';
import { AccessTokenGuard } from './access-token.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { DEFAULT_SCRYPT_PARAMS, PasswordHasher } from './password-hasher.js';
import { TokensService } from './tokens.service.js';

const MIN_SECRET_LENGTH = 32;

@Module({
  imports: [
    UsersModule,
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
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: 60_000,
          limit: Number(config.get('AUTH_RATE_LIMIT_PER_MINUTE') ?? 10),
        },
      ],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenGuard,
    {
      provide: TokensService,
      inject: [JwtService, ConfigService],
      useFactory: (jwt: JwtService, config: ConfigService) =>
        new TokensService(
          jwt,
          Number(config.get('JWT_EXPIRES_IN_SECONDS') ?? 3600),
        ),
    },
    {
      provide: PasswordHasher,
      inject: [ConfigService],
      // SCRYPT_LOG_N lowers the cost in tests; production uses the default.
      useFactory: (config: ConfigService) => {
        const logN = config.get<string>('SCRYPT_LOG_N');
        return new PasswordHasher(
          logN ? { ...DEFAULT_SCRYPT_PARAMS, N: 2 ** Number(logN) } : undefined,
        );
      },
    },
  ],
})
export class AuthModule {}
