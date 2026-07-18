/**
 * Standard token response returned after successful authentication or
 * token refresh.
 *
 * Contains the JWT access token, a UUID refresh token for rotation,
 * and the access token lifetime in seconds.
 */
export class TokenResponseDto {
  /** JWT access token for authenticated requests. */
  accessToken: string;

  /** UUID v4 refresh token for token rotation. */
  refreshToken: string;

  /** Access token lifetime in seconds (default: 900 / 15 min). */
  expiresIn: number;

  constructor(accessToken: string, refreshToken: string, expiresIn: number) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresIn = expiresIn;
  }
}
