import { randomUUID } from 'crypto';
import { Id } from '@payroll/shared-kernel';

/**
 * Type-safe identifier for the User aggregate.
 *
 * Extends the shared-kernel `Id` value object with the `'UserId'` brand,
 * providing compile-time type safety for user identity.
 *
 * @example
 * ```ts
 * const id = UserId.create();             // random UUID
 * const fromValue = UserId.from('abc');   // from existing string
 * ```
 */
export class UserId extends Id<'UserId'> {
  private constructor(value: string) {
    super(value);
  }

  /** Generates a new random UserId (UUID v4). */
  static create(): UserId {
    return new UserId(randomUUID());
  }

  /** Creates a UserId from an existing non-empty string value. */
  static from(value: string): UserId {
    return new UserId(value);
  }
}
