/**
 * Port interface for idempotent event processing.
 *
 * Implementations track which external events have already been consumed
 * to guarantee exactly-once processing semantics.
 */
export interface ProcessedEventStore {
  /**
   * Checks whether an event has already been processed.
   *
   * @param eventId - The unique identifier of the event to check.
   * @returns `true` if the event was already processed.
   */
  isProcessed(eventId: string): Promise<boolean>;

  /**
   * Marks an event as processed so future replays are ignored.
   *
   * @param eventId - The unique identifier of the processed event.
   */
  markAsProcessed(eventId: string): Promise<void>;
}
