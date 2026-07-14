import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { PasswordHasher } from '../../domain/password-hasher';

/**
 * Bcrypt-based implementation of the {@link PasswordHasher} port.
 *
 * Uses bcrypt with 12 salt rounds for password hashing. The salt rounds
 * provide a configurable work factor — 12 rounds is a reasonable balance
 * between security and performance as of 2026.
 *
 * @example
 * ```ts
 * const hasher = new BcryptPasswordHasher();
 * const hash = await hasher.hash('myPassword');
 * const isValid = await hasher.verify('myPassword', hash);
 * ```
 */
@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  /** Number of bcrypt salt rounds — higher values are slower but more secure. */
  private readonly SALT_ROUNDS = 12;

  /**
   * Hashes a plain-text password using bcrypt.
   *
   * A random salt is auto-generated using the configured number of rounds.
   *
   * @param password - The plain-text password to hash.
   * @returns A promise that resolves to the bcrypt hash string.
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verifies a plain-text password against a stored bcrypt hash.
   *
   * @param password - The plain-text password to verify.
   * @param hash - The stored bcrypt hash to compare against.
   * @returns A promise that resolves to `true` if the password matches.
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
