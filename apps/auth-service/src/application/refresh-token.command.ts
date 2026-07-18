import { createHash } from 'crypto';
import { UserId } from '../domain/user-id';
import { RefreshToken } from '../domain/refresh-token.entity';
import type { UserRepository } from '../domain/user.repository';
import type { TokenService, TokenResponse } from '../domain/token-service';
import type { RefreshTokenRepository } from '../domain/refresh-token.repository';
import { RefreshTokenError } from './errors';

/**
 * Command to rotate a refresh token.
 *
 * Accepts a raw refresh token string, validates it against the
 * stored (hashed) token, and issues a new access/refresh token pair.
 * The old refresh token is revoked to enforce single-use rotation.
 */
export class RefreshTokenCommand {
  constructor(public readonly refreshToken: string) {}
}

/**
 * Handler for the RefreshTokenCommand.
 *
 * Validates the refresh token (not revoked, not expired), revokes
 * the old token, and issues a new token pair. If a revoked token
 * is presented, the request is rejected (potential token theft).
 */
export class RefreshTokenHandler {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Executes the refresh token command.
   *
   * @param command - The command containing the raw refresh token string.
   * @returns A new TokenResponse with rotated tokens.
   * @throws {RefreshTokenError} If the token is revoked or expired.
   */
  async execute(command: RefreshTokenCommand): Promise<TokenResponse> {
    const tokenHash = createHash('sha256').update(command.refreshToken).digest('hex');
    const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken) {
      throw new RefreshTokenError('Invalid refresh token');
    }

    if (storedToken.isRevoked) {
      throw new RefreshTokenError('Refresh token has been revoked');
    }

    if (storedToken.isExpired()) {
      throw new RefreshTokenError('Refresh token has expired');
    }

    // Revoke the old token (single-use rotation)
    storedToken.revoke();
    await this.refreshTokenRepository.save(storedToken);

    // Generate new tokens
    const userId = UserId.from(storedToken.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new RefreshTokenError('User not found');
    }

    const tokens = await this.tokenService.generateTokens(user);

    // Persist the new refresh token (hashed)
    const newTokenHash = createHash('sha256').update(tokens.refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
    const newRefreshToken = RefreshToken.create(userId, newTokenHash, expiresAt, user.companyId);
    await this.refreshTokenRepository.save(newRefreshToken);

    return tokens;
  }
}
