import { ValueObject } from './value-object';

const ISO_4217_REGEX = /^[A-Z]{3}$/;

export class Money extends ValueObject<{ amountCents: number; currency: string }> {
  private constructor(amountCents: number, currency: string) {
    Money.validate(amountCents, currency);
    super({ amountCents, currency });
  }

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

  static fromCents(amountCents: number, currency: string): Money {
    return new Money(amountCents, currency);
  }

  get amount(): number {
    return this.props.amountCents;
  }

  get currency(): string {
    return this.props.currency;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(
        `Cannot add Money with different currencies: ${this.currency} and ${other.currency}`,
      );
    }
    return new Money(this.amount + other.amount, this.currency);
  }

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
