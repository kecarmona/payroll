import type { User } from './user.entity';

/**
 * Token response returned by the TokenService.
 */
export interface TokenResponse {
  /** The JWT access token string. */
  readonly accessToken: string;
  /** The raw refresh token string (to be hashed before storage). */
  readonly refreshToken: string;
  /** Token lifetime in seconds. */
  readonly expiresIn: number;
}

/**
 * Port interface for JWT and refresh token generation.
 *
 * Defines the contract for issuing authentication tokens. The implementation
 * lives in the infrastructure layer (e.g., @nestjs/jwt), keeping the
 * application layer decoupled from any specific JWT library.
 *
 * Implementations MUST:
 * - Generate a JWT access token with sub, email, roles[], companyId, iat, exp
 * - Generate a cryptographically secure random refresh token string
 * - Return the raw refresh token (the handler hashes it before storage)
 */
export interface TokenService {
  /**
   * Generates an access token and a refresh token for the given user.
   *
   * @param user - The authenticated user to generate tokens for.
   * @returns An object containing the access token, raw refresh token, and expiration.
   */
  generateTokens(user: User): Promise<TokenResponse>;
}
