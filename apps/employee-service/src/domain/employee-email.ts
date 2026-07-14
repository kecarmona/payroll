import { ValueObject } from '@payroll/shared-kernel';

/**
 * Email address value object with built-in format validation.
 *
 * Unlike the auth UserEmail, this value object ALLOWS empty strings to
 * support auto-provisioned users whose email may not yet be known.
 * Non-empty values are validated against a standard email format.
 *
 * @example
 * ```ts
 * const email = EmployeeEmail.from('employee@example.com');
 * console.log(email.value); // 'employee@example.com'
 *
 * const autoProvisioned = EmployeeEmail.from(''); // allowed
 * console.log(autoProvisioned.value); // ''
 * ```
 */
export class EmployeeEmail extends ValueObject<{ value: string }> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(value: string) {
    if (value && value.trim().length === 0) {
      throw new Error('EmployeeEmail cannot be whitespace-only');
    }

    if (value.length > 0 && !EmployeeEmail.EMAIL_REGEX.test(value)) {
      throw new Error(`Invalid email format: "${value}"`);
    }

    super({ value: value ? value.toLowerCase() : '' });
  }

  /** The raw email address string (empty string for auto-provisioned users). */
  get value(): string {
    return this.props.value;
  }

  /**
   * Creates an EmployeeEmail from a string, validating the format unless empty.
   *
   * @param value - A valid email address or empty string.
   * @throws {Error} If the value is non-empty but has an invalid email format.
   */
  static from(value: string): EmployeeEmail {
    return new EmployeeEmail(value);
  }
}
