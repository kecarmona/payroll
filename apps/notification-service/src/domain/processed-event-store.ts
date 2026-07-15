/**
 * Port interface for idempotent event processing tracking.
 *
 * Ensures that the same event is never processed more than once,
 * even if the Kafka consumer delivers it multiple times (at-least-once
 * delivery semantics).
 *
 * Implementations typically store processed event IDs with their
 * corresponding notification request ID in a deduplication table.
 */
export interface ProcessedEventStore {
  /**
   * Returns true if the given event ID has already been processed.
   *
   * @param eventId - The unique event ID to check for duplicates.
   * @returns True if the event was already processed.
   */
  exists(eventId: string): Promise<boolean>;

  /**
   * Records that an event has been processed.
   *
   * @param eventId - The unique event ID that was processed.
   * @param notificationId - The notification request ID created for this event.
   */
  markProcessed(eventId: string, notificationId: string): Promise<void>;
}
