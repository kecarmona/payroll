/**
 * Port interface for the transactional outbox storage.
 *
 * Defines the contract for persisting outbox messages that will be
 * published to Kafka by a background publisher.
 *
 * Implementations store events in a durable backing store (e.g., TypeORM/PostgreSQL)
 * as part of the same ACID transaction that produces the domain event.
 */
export interface OutboxStore {
  /**
   * Saves a new outbox record for later publication.
   *
   * The record must be persisted with `publishedAt = NULL` so that the
   * outbox publisher can pick it up in a subsequent poll cycle.
   *
   * @param event - The outbox event data to persist.
   */
  save(event: {
    /** Unique identifier for this outbox record (UUID). */
    id: string;
    /** The domain event type string (e.g. 'PayrollJobCreated'). */
    eventType: string;
    /** The aggregate ID that produced this event. */
    aggregateId: string;
    /** The event payload to be serialized for Kafka. */
    payload: unknown;
  }): Promise<void>;
}
