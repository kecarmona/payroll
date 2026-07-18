import { randomUUID } from 'crypto';
import { Id } from './id';

export class CompanyId extends Id<'CompanyId'> {
  private constructor(value: string) {
    super(value);
  }

  static create(): CompanyId {
    return new CompanyId(randomUUID());
  }

  static from(value: string): CompanyId {
    return new CompanyId(value);
  }
}
