/**
 * Port interface for the outbox publisher.
 *
 * Defines the contract for polling pending outbox records and publishing
 * them to the message broker (Kafka).
 *
 * Implementations are expected to:
 * - Poll unpublished records (`publishedAt IS NULL`)
 * - Serialize each record using an {@link EventSerializer}
 * - Resolve the target topic using a {@link TopicRegistry}
 * - Publish to Kafka via the configured producer
 * - Mark records as published on success
 * - Log and increment retry count on failure
 */
export interface OutboxPublisher {
  /**
   * Polls the outbox table and publishes pending events to Kafka.
   *
   * Must be safe to call concurrently (multiple poll cycles can overlap
   * if the previous cycle is still running).
   */
  publishPending(): Promise<void>;
}
