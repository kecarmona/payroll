import { randomUUID } from 'crypto';
import { Id } from '@payroll/shared-kernel';

/**
 * Type-safe identifier for the PayrollJob aggregate.
 *
 * Extends the shared-kernel `Id` value object with the `'PayrollJobId'` brand,
 * providing compile-time type safety for payroll job identity.
 *
 * @example
 * ```ts
 * const id = PayrollJobId.create();             // random UUID
 * const fromValue = PayrollJobId.from('pj-1');  // from existing string
 * ```
 */
export class PayrollJobId extends Id<'PayrollJobId'> {
  private constructor(value: string) {
    super(value);
  }

  /** Generates a new random PayrollJobId (UUID v4). */
  static create(): PayrollJobId {
    return new PayrollJobId(randomUUID());
  }

  /** Creates a PayrollJobId from an existing non-empty string value. */
  static from(value: string): PayrollJobId {
    return new PayrollJobId(value);
  }

  /**
   * Converts a generic Id<'PayrollJobId'> to the typed PayrollJobId.
   * Useful when reconstructing from repository data.
   */
  static fromId(id: Id<'PayrollJobId'>): PayrollJobId {
    return new PayrollJobId(id.toString());
  }
}
