import { RefreshToken } from './refresh-token.entity';

/**
 * Port interface for RefreshToken repository operations.
 *
 * Defines the contract for persisting and retrieving RefreshToken entities.
 * The implementation lives in the infrastructure layer (TypeORM).
 */
export interface RefreshTokenRepository {
  /**
   * Persists a RefreshToken entity.
   *
   * @param token - The RefreshToken to save.
   */
  save(token: RefreshToken): Promise<void>;

  /**
   * Finds a refresh token by its hashed value.
   *
   * @param tokenHash - The hashed token value to search for.
   * @returns The RefreshToken entity, or `null` if not found.
   */
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;

  /**
   * Revokes all active refresh tokens for a given user.
   *
   * Used when token theft is detected (a revoked token is reused).
   *
   * @param userId - The user whose tokens should all be revoked.
   */
  revokeAllForUser(userId: string): Promise<void>;
}
