import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { User } from '../users/entities/user.entity.js';
import {
  AccessTokenGuard,
  type AuthenticatedUser,
  CurrentUser,
} from './access-token.guard.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthResponse } from './entities/auth-response.entity.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Create a patient account and log in. */
  @Post('register')
  @UseGuards(ThrottlerGuard)
  @ApiBadRequestResponse({ description: 'Invalid email, password or name' })
  @ApiConflictResponse({ description: 'Email already registered' })
  @ApiTooManyRequestsResponse({ description: 'Too many attempts; try later' })
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  /** Log in with email and password to get an access token. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  @ApiTooManyRequestsResponse({ description: 'Too many attempts; try later' })
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  /** The account that the access token belongs to. */
  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
  me(@CurrentUser() user: AuthenticatedUser): Promise<User> {
    return this.authService.me(user.id);
  }
}
