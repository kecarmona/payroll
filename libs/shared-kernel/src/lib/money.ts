import { ValueObject } from './value-object';

/**
 * Regular expression for ISO 4217 currency codes.
 * Matches exactly three uppercase letters (e.g. USD, EUR, ARS).
 */
const ISO_4217_REGEX = /^[A-Z]{3}$/;

/**
 * Represents a monetary value as integer cents with an ISO 4217 currency code.
 *
 * All amounts use integer cents to avoid floating-point precision issues common
 * with native JavaScript numbers. The primary factory is {@link fromCents}.
 *
 * @example
 * ```ts
 * const salary = Money.fromCents(500000, 'USD'); // $5,000.00
 * const tax = Money.fromCents(7500, 'USD');      // $75.00
 * const net = salary.subtract(tax);              // $4,925.00
 * ```
 */
export class Money extends ValueObject<{ amountCents: number; currency: string }> {
  private constructor(amountCents: number, currency: string) {
    Money.validate(amountCents, currency);
    super({ amountCents, currency });
  }

  /**
   * Validates Money invariants at construction time.
   *
   * @throws {Error} If amountCents is negative or currency is not a valid ISO 4217 code.
   */
  private static validate(amountCents: number, currency: string): void {
    if (amountCents < 0) {
      throw new Error('Money amount cannot be negative');
    }

    if (!currency || !ISO_4217_REGEX.test(currency)) {
      throw new Error(
        `Invalid currency code: "${currency}". Must be a 3-letter uppercase ISO 4217 code.`,
      );
    }
  }

  /**
   * Creates a `Money` instance from an amount in cents and a currency code.
   *
   * This is the single factory method — no dollar-based factory is provided
   * to avoid floating-point ambiguity at the domain layer boundary.
   *
   * @param amountCents - The monetary amount in cents (integer, non-negative).
   * @param currency    - A 3-letter uppercase ISO 4217 currency code.
   * @returns A new `Money` value object.
   */
  static fromCents(amountCents: number, currency: string): Money {
    return new Money(amountCents, currency);
  }

  /** The monetary amount in cents (e.g. 1000 = $10.00 for USD). */
  get amount(): number {
    return this.props.amountCents;
  }

  /** The ISO 4217 currency code (e.g. "USD", "EUR", "ARS"). */
  get currency(): string {
    return this.props.currency;
  }

  /**
   * Adds another `Money` instance to this one.
   *
   * Both instances must share the same currency — a cross-currency operation
   * throws an Error. This is intentional: currency conversion is an
   * application-layer concern, not a domain primitive responsibility.
   *
   * @param other - The `Money` instance to add (same currency).
   * @returns A new `Money` with the summed amount and same currency.
   * @throws {Error} If currencies differ.
   */
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot add Money with different currencies: ${this.currency} and ${other.currency}`,
      );
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  /**
   * Subtracts another `Money` instance from this one.
   *
   * Both instances must share the same currency. The result is guaranteed
   * to be non-negative — a subtraction that would produce a negative result
   * throws an Error.
   *
   * @param other - The `Money` instance to subtract (same currency).
   * @returns A new `Money` with the difference and same currency.
   * @throws {Error} If currencies differ or result would be negative.
   */
  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot subtract Money with different currencies: ${this.currency} and ${other.currency}`,
      );
    }
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Cannot subtract — result would be negative');
    }
    return new Money(result, this.currency);
  }
}
