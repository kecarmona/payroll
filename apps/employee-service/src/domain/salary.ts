import { ValueObject, Money } from '@payroll/shared-kernel';

/**
 * Value object representing an employee's salary.
 *
 * Wraps the shared-kernel `Money` value object to provide employee-specific
 * semantics. The amount is stored in cents and the currency is an ISO 4217
 * three-letter uppercase code.
 *
 * @example
 * ```ts
 * const salary = Salary.from(500000, 'USD'); // $5,000.00
 * console.log(salary.amount);   // 500000
 * console.log(salary.currency); // 'USD'
 * ```
 */
export class Salary extends ValueObject<{ amountCents: number; currency: string }> {
  private constructor(amountCents: number, currency: string) {
    // Delegate validation to Money
    Money.fromCents(amountCents, currency);
    super({ amountCents, currency });
  }

  /** Returns the salary amount in cents. */
  get amount(): number {
    return this.props.amountCents;
  }

  /** Returns the ISO 4217 currency code. */
  get currency(): string {
    return this.props.currency;
  }

  /**
   * Creates a Salary from an amount in cents and an ISO 4217 currency code.
   *
   * @param amountCents - The salary amount in cents (non-negative integer).
   * @param currency    - A 3-letter uppercase ISO 4217 currency code.
   * @throws {Error} If the amount is negative or the currency code is invalid.
   */
  static from(amountCents: number, currency: string): Salary {
    return new Salary(amountCents, currency);
  }
}
