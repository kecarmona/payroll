import { ValueObject } from '@payroll/shared-kernel';

/**
 * Value object representing an employee's full name.
 *
 * Names must be non-empty, between 1 and 100 characters after trimming.
 *
 * @example
 * ```ts
 * const name = EmployeeName.from('John Doe');
 * console.log(name.value); // 'John Doe'
 * ```
 */
export class EmployeeName extends ValueObject<{ value: string }> {
  private static readonly MAX_LENGTH = 100;

  private constructor(value: string) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('EmployeeName cannot be empty');
    }

    if (trimmed.length > EmployeeName.MAX_LENGTH) {
      throw new Error(
        `EmployeeName cannot exceed ${EmployeeName.MAX_LENGTH} characters (got ${trimmed.length})`,
      );
    }

    super({ value: trimmed });
  }

  /** The trimmed name string. */
  get value(): string {
    return this.props.value;
  }

  /**
   * Creates an EmployeeName from a string, trimming and validating.
   *
   * @param value - A non-empty name string (1-100 chars after trimming).
   * @throws {Error} If the name is empty or exceeds 100 characters.
   */
  static from(value: string): EmployeeName {
    return new EmployeeName(value);
  }
}
