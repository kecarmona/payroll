import { randomUUID } from 'crypto';
import { Id } from '@payroll/shared-kernel';

/**
 * Type-safe identifier for the PayrollPeriod aggregate.
 *
 * Extends the shared-kernel `Id` value object with the `'PayrollPeriodId'` brand,
 * providing compile-time type safety for payroll period identity.
 *
 * @example
 * ```ts
 * const id = PayrollPeriodId.create();             // random UUID
 * const fromValue = PayrollPeriodId.from('pp-1');  // from existing string
 * ```
 */
export class PayrollPeriodId extends Id<'PayrollPeriodId'> {
  private constructor(value: string) {
    super(value);
  }

  /** Generates a new random PayrollPeriodId (UUID v4). */
  static create(): PayrollPeriodId {
    return new PayrollPeriodId(randomUUID());
  }

  /** Creates a PayrollPeriodId from an existing non-empty string value. */
  static from(value: string): PayrollPeriodId {
    return new PayrollPeriodId(value);
  }

  /**
   * Converts a generic Id<'PayrollPeriodId'> to the typed PayrollPeriodId.
   * Useful when reconstructing from repository data.
   */
  static fromId(id: Id<'PayrollPeriodId'>): PayrollPeriodId {
    return new PayrollPeriodId(id.toString());
  }
}
