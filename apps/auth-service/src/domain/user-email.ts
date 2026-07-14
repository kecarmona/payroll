import { ValueObject } from '@payroll/shared-kernel';

/**
 * Email address value object with built-in format validation.
 *
 * Validates email format at construction time and provides structural
 * equality comparison. The raw email string is accessible via `value`.
 *
 * @example
 * ```ts
 * const email = UserEmail.from('user@example.com');
 * console.log(email.value); // 'user@example.com'
 * ```
 */
export class UserEmail extends ValueObject<{ value: string }> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('UserEmail cannot be empty');
    }

    if (!UserEmail.EMAIL_REGEX.test(value)) {
      throw new Error(`Invalid email format: "${value}"`);
    }

    super({ value: value.toLowerCase() });
  }

  /** The raw email address string. */
  get value(): string {
    return this.props.value;
  }

  /**
   * Creates a UserEmail from a string, validating the format.
   *
   * @param value - A valid email address.
   * @throws {Error} If the email format is invalid.
   */
  static from(value: string): UserEmail {
    return new UserEmail(value);
  }
}
