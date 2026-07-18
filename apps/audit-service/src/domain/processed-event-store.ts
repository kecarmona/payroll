/**
 * Port interface for idempotent event processing tracking.
 *
 * The `ProcessedEventStore` tracks which event IDs have already been
 * processed by the audit service. This prevents duplicate audit records
 * when the same event is delivered more than once (at-least-once delivery).
 *
 * Implementations typically use a database table or Redis set keyed by
 * `eventId` with a TTL for automatic cleanup.
 */
export interface ProcessedEventStore {
  /**
   * Marks an event as processed.
   *
   * If the event ID was already marked, this is a no-op.
   *
   * @param eventId - The unique identifier of the processed event.
   */
  markProcessed(eventId: string): Promise<void>;

  /**
   * Checks whether an event has already been processed.
   *
   * @param eventId - The unique identifier of the event to check.
   * @returns `true` if the event was already processed.
   */
  isProcessed(eventId: string): Promise<boolean>;
}
