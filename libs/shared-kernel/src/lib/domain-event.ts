/**
 * Represents a business event that already happened in the domain.
 *
 * Domain events are immutable records of past occurrences. They are recorded
 * by {@link AggregateRoot.recordEvent} during command execution and published
 * after persistence via the transactional outbox pattern.
 *
 * Every domain event carries:
 * - A unique identifier (`eventId`) for deduplication.
 * - The aggregate identity (`aggregateId`) it originated from.
 * - A version number for schema evolution.
 * - A timestamp (`occurredAt`) for ordering and auditing.
 * - A free-form `payload` with the event-specific data.
 *
 * @typeParam TPayload - The shape of the event-specific data.
 */
export interface DomainEvent<TPayload = unknown> {
  /** Unique identifier for this event instance (used for idempotency). */
  readonly eventId: string;

  /** Machine-readable event type name (e.g. "payroll.job.created"). */
  readonly eventType: string;

  /**
   * Schema version for the event payload.
   * Increment when the payload shape changes to enable consumer migration.
   */
  readonly version: number;

  /** ISO timestamp when the event occurred in the domain. */
  readonly occurredAt: Date;

  /** The tenant (company) this event belongs to. */
  readonly companyId: string;

  /** The aggregate root ID that produced this event. */
  readonly aggregateId: string;

  /** The event-specific data payload. */
  readonly payload: TPayload;
}

