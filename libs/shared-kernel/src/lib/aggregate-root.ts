import { Entity } from './entity';
import { DomainEvent } from './domain-event';

export abstract class AggregateRoot<TId extends string> extends Entity<TId> {
  private _events: DomainEvent[] = [];

  protected constructor(id: TId, companyId: string, version?: number) {
    super(id, companyId, version);
  }

  recordEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = [...this._events];
    this._events = [];
    return events;
  }

  clearEvents(): void {
    this._events = [];
  }

  assertVersion(expected: number): void {
    if (this.version !== expected) {
      throw new Error(
        `Version mismatch: expected ${expected}, current ${this.version}`,
      );
    }
  }
}
