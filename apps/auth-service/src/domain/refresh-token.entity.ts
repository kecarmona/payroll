import { randomUUID } from 'crypto';
import { Entity } from '@payroll/shared-kernel';
import type { UserId } from './user-id';

/**
 * Refresh token entity supporting rotation and theft detection.
 *
 * Refresh tokens are stored hashed, are single-use (rotated on each refresh),
 * and carry an expiration date. When a revoked token is presented again,
 * it signals potential token theft and all user sessions should be revoked.
 *
 * This is a separate aggregate from User, enabling independent garbage
 * collection of expired tokens without loading the User aggregate.
 *
 * @example
 * ```ts
 * const token = RefreshToken.create(
 *   userId,
 *   'hashed-token-value',
 *   new Date(Date.now() + 7 * 86400000),
 * );
 * ```
 */
export class RefreshToken extends Entity<string> {
  private readonly _userId: string;
  private readonly _tokenHash: string;
  private readonly _expiresAt: Date;
  private _isRevoked: boolean;

  private constructor(
    id: string,
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    companyId: string,
    isRevoked: boolean,
    version?: number,
  ) {
    super(id, companyId, version);
    this._userId = userId;
    this._tokenHash = tokenHash;
    this._expiresAt = expiresAt;
    this._isRevoked = isRevoked;
  }

  /** The user this refresh token belongs to. */
  get userId(): string {
    return this._userId;
  }

  /** The hashed token value. */
  get tokenHash(): string {
    return this._tokenHash;
  }

  /** When this token expires. */
  get expiresAt(): Date {
    return this._expiresAt;
  }

  /** Whether this token has been revoked (used). */
  get isRevoked(): boolean {
    return this._isRevoked;
  }

  /**
   * Creates a new active refresh token.
   *
   * @param userId - The user this token authenticates.
   * @param tokenHash - The hashed token value.
   * @param expiresAt - When this token expires.
   * @param companyId - The tenant identifier.
   * @returns A new non-revoked RefreshToken.
   */
  static create(
    userId: UserId,
    tokenHash: string,
    expiresAt: Date,
    companyId = '',
  ): RefreshToken {
    return new RefreshToken(
      randomUUID(),
      userId.toString(),
      tokenHash,
      expiresAt,
      companyId,
      false,
      0,
    );
  }

  /**
   * Revokes this refresh token (marks it as used).
   *
   * A revoked token should not be accepted for authentication.
   * Idempotent — revoking an already-revoked token is a no-op.
   */
  revoke(): void {
    this._isRevoked = true;
  }

  /**
   * Checks whether this token has expired.
   *
   * @returns `true` if the current time is past the expiration date.
   */
  isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  /**
   * Reconstitutes a RefreshToken from persisted data.
   *
   * This is the reconstruction path used by repositories when loading
   * tokens from the database, bypassing the standard creation path.
   *
   * @param props - All persisted properties of the token.
   * @returns A reconstituted RefreshToken instance.
   */
  static reconstitute(props: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    companyId: string;
    isRevoked: boolean;
    version: number;
  }): RefreshToken {
    return new RefreshToken(
      props.id,
      props.userId,
      props.tokenHash,
      props.expiresAt,
      props.companyId,
      props.isRevoked,
      props.version,
    );
  }
}
