import { randomUUID } from 'crypto';
import { Id } from '@payroll/shared-kernel';

/**
 * Type-safe identifier for the Employee aggregate.
 *
 * Extends the shared-kernel `Id` value object with the `'EmployeeId'` brand,
 * providing compile-time type safety for employee identity.
 *
 * @example
 * ```ts
 * const id = EmployeeId.create();             // random UUID
 * const fromValue = EmployeeId.from('emp-1'); // from existing string
 * ```
 */
export class EmployeeId extends Id<'EmployeeId'> {
  private constructor(value: string) {
    super(value);
  }

  /** Generates a new random EmployeeId (UUID v4). */
  static create(): EmployeeId {
    return new EmployeeId(randomUUID());
  }

  /** Creates an EmployeeId from an existing non-empty string value. */
  static from(value: string): EmployeeId {
    return new EmployeeId(value);
  }
}
