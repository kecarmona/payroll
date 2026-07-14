/**
 * Port interface for the transactional outbox storage.
 *
 * Defines the contract for persisting outbox messages that will be
 * published to Kafka by a background publisher (Phase 8).
 *
 * The implementation lives in the infrastructure layer (TypeORM).
 */
export interface OutboxStore {
  /**
   * Saves a new outbox record.
   *
   * The record will later be picked up by the outbox publisher for
   * Kafka publication.
   *
   * @param event - The outbox event data to persist.
   */
  save(event: {
    /** Unique identifier for this outbox record. */
    id: string;
    /** The domain event type string (e.g. 'PayrollJobCreated'). */
    eventType: string;
    /** The aggregate ID that produced this event. */
    aggregateId: string;
    /** The event payload to be serialized. */
    payload: unknown;
  }): Promise<void>;
}
