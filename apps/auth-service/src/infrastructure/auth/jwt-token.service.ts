import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import type { User } from '../../domain/user.entity';
import type { TokenService, TokenResponse } from '../../domain/token-service';

/**
 * JWT-based implementation of the {@link TokenService} port.
 *
 * Generates access tokens as signed JWTs using the configured {@link JwtService},
 * and refresh tokens as cryptographically secure random UUIDs.
 *
 * Access token payload includes:
 * - `sub` — the user's unique identifier (UserId)
 * - `email` — the user's email address
 * - `roles` — the user's role(s) as an array
 * - `companyId` — the tenant identifier
 * - `iat` / `exp` — standard JWT timestamps (added by JwtService)
 *
 * Refresh tokens are returned as raw UUIDs (to be hashed with SHA-256
 * before storage) and expire after 7 days by default.
 *
 * @example
 * ```ts
 * const tokenService = new JwtTokenService(jwtService);
 * const tokens = await tokenService.generateTokens(user);
 * // { accessToken: 'eyJ...', refreshToken: 'uuid-string', expiresIn: 900 }
 * ```
 */
@Injectable()
export class JwtTokenService implements TokenService {
  /** Access token lifetime in seconds (15 minutes). */
  private readonly ACCESS_TOKEN_TTL = 900;

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Generates an access token and a refresh token for the given user.
   *
   * The access token is a signed JWT containing the user's identity and
   * role claims. The refresh token is a random UUID that must be hashed
   * (SHA-256) before storage.
   *
   * @param user - The authenticated user to generate tokens for.
   * @returns An object containing the access token, raw refresh token, and expiration.
   */
  async generateTokens(user: User): Promise<TokenResponse> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: [user.role],
      companyId: user.companyId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.ACCESS_TOKEN_TTL,
    });

    const refreshToken = randomUUID();

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_TTL,
    };
  }
}
