import { randomUUID } from 'crypto';
import { Id } from '@payroll/shared-kernel';

/**
 * Type-safe identifier for the PayrollTransaction aggregate.
 *
 * @example
 * ```ts
 * const id = PayrollTransactionId.create();
 * const fromValue = PayrollTransactionId.from('pt-123');
 * ```
 */
export class PayrollTransactionId extends Id<'PayrollTransactionId'> {
  private constructor(value: string) {
    super(value);
  }

  /** Generates a new random PayrollTransactionId (UUID v4). */
  static create(): PayrollTransactionId {
    return new PayrollTransactionId(randomUUID());
  }

  /** Creates a PayrollTransactionId from an existing non-empty string value. */
  static from(value: string): PayrollTransactionId {
    return new PayrollTransactionId(value);
  }

  /** Converts a generic Id to the typed PayrollTransactionId. */
  static fromId(id: Id<'PayrollTransactionId'>): PayrollTransactionId {
    return new PayrollTransactionId(id.toString());
  }
}
