import { User } from '../../users/entities/user.entity.js';

export class AuthResponse {
  /** Send as `Authorization: Bearer <accessToken>`. */
  accessToken: string;
  tokenType: 'Bearer';
  /** Seconds until the access token expires. */
  expiresIn: number;
  user: User;
}
