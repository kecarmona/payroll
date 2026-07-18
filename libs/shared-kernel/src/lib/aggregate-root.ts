import { Entity } from './entity';
import { DomainEvent } from './domain-event';

/**
 * Base class for all Aggregate Roots in the domain.
 *
 * An Aggregate Root is the entry point of a DDD aggregate — it guarantees
 * consistency within its boundary and is the only object that external actors
 * may hold references to.
 *
 * This class extends {@link Entity} with:
 * - **Domain event recording** — events are recorded during command execution
 *   and pulled out after persistence (`recordEvent` / `pullEvents`).
 * - **Optimistic locking** — `assertVersion` verifies the expected version
 *   matches the current version before mutations.
 *
 * @typeParam TId - The string type for the entity identifier (e.g. `'CompanyId'`).
 */
export abstract class AggregateRoot<TId extends string = string> extends Entity<TId> {
  /** Internal list of recorded but not-yet-published domain events. */
  private _events: DomainEvent[] = [];

  protected constructor(id: TId, companyId: string, version?: number) {
    super(id, companyId, version);
  }

  /**
   * Records a domain event for later publication.
   *
   * Events are accumulated until {@link pullEvents} is called, typically
   * after the aggregate is persisted. This enables the transactional outbox
   * pattern — events are published only after the database transaction commits.
   *
   * @param event - The domain event to record.
   */
  recordEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  /**
   * Returns all recorded events and clears the internal event list.
   *
   * This is a destructive read — after calling this method, the aggregate
   * considers all events as published. Consecutive calls return an empty array.
   *
   * @returns An array of recorded domain events.
   */
  pullEvents(): DomainEvent[] {
    const events = [...this._events];
    this._events = [];
    return events;
  }

  /**
   * Manually clears all recorded events without publishing them.
   *
   * Useful for testing or when events should be discarded (e.g. after a
   * rollback or when reconstituting from persistence).
   */
  clearEvents(): void {
    this._events = [];
  }

  /**
   * Asserts that the aggregate's current version matches the expected version.
   *
   * Used for optimistic concurrency control. If the version has changed since
   * the aggregate was loaded, a concurrent modification occurred and the
   * operation must be retried.
   *
   * @param expected - The version the caller expects the aggregate to be at.
   * @throws {Error} If the expected version does not match the current version.
   */
  assertVersion(expected: number): void {
    if (this.version !== expected) {
      throw new Error(
        `Version mismatch: expected ${expected}, current ${this.version}`,
      );
    }
  }
}
