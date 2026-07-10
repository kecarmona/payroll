import { randomUUID } from 'crypto';
import { ValueObject } from './value-object';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class Id<T> extends ValueObject<{ value: string }> {
  protected constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Id cannot be empty');
    }
    super({ value });
  }

  toString(): string {
    return this.props.value;
  }

  static from<T = unknown>(value: string): Id<T> {
    return new Id<T>(value);
  }

  static generate<T = unknown>(): Id<T> {
    return new Id<T>(randomUUID());
  }
}
