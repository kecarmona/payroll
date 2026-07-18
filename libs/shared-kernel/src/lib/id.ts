import { randomUUID } from 'crypto';
import { ValueObject } from './value-object';

/**
 * Type-safe, branded identifier value object.
 *
 * The generic parameter `T` provides compile-time type safety — two `Id` instances
 * with different type parameters are not interchangeable even if their values match.
 *
 * @typeParam T - Phantom brand type used to distinguish different entity IDs at the type level.
 *                For example, `Id<'CompanyId'>` is not assignable to `Id<'EmployeeId'>`.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Id<T> extends ValueObject<{ value: string }> {
  /**
   * @param value - The raw string identifier. Must be non-empty — throws otherwise.
   */
  protected constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Id cannot be empty');
    }
    super({ value });
  }

  /** Returns the raw string value of this identifier. */
  toString(): string {
    return this.props.value;
  }

  /**
   * Creates an `Id` from an existing string value.
   * Validates that the value is non-empty at construction.
   *
   * @param value - A non-empty string identifier.
   * @returns A new `Id<T>` instance wrapping the given value.
   */
  static from<T = unknown>(value: string): Id<T> {
    return new Id<T>(value);
  }

  /**
   * Generates a new `Id` with a random UUID v4 value.
   * Uses Node's `crypto.randomUUID()` under the hood.
   *
   * @returns A new `Id<T>` with a UUID v4 string value.
   */
  static generate<T = unknown>(): Id<T> {
    return new Id<T>(randomUUID());
  }
}
