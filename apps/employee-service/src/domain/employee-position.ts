import { ValueObject } from '@payroll/shared-kernel';

/**
 * Value object representing an employee's position/title.
 *
 * Positions must be non-empty, between 1 and 100 characters after trimming.
 *
 * @example
 * ```ts
 * const position = EmployeePosition.from('Software Engineer');
 * console.log(position.value); // 'Software Engineer'
 * ```
 */
export class EmployeePosition extends ValueObject<{ value: string }> {
  private static readonly MAX_LENGTH = 100;

  private constructor(value: string) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('EmployeePosition cannot be empty');
    }

    if (trimmed.length > EmployeePosition.MAX_LENGTH) {
      throw new Error(
        `EmployeePosition cannot exceed ${EmployeePosition.MAX_LENGTH} characters (got ${trimmed.length})`,
      );
    }

    super({ value: trimmed });
  }

  /** The trimmed position string. */
  get value(): string {
    return this.props.value;
  }

  /**
   * Creates an EmployeePosition from a string, trimming and validating.
   *
   * @param value - A non-empty position string (1-100 chars after trimming).
   * @throws {Error} If the position is empty or exceeds 100 characters.
   */
  static from(value: string): EmployeePosition {
    return new EmployeePosition(value);
  }
}
