import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Port interface for publishing domain events.
 *
 * Defines the contract for publishing domain events after an aggregate
 * is persisted. The implementation lives in the infrastructure layer,
 * converting DomainEvent to EventEnvelope and delegating to the
 * event-bus EventPublisher.
 *
 * This is a domain-level port — the application layer depends on this
 * interface, not on any specific messaging infrastructure.
 */
export interface EventPublisher {
  /**
   * Publishes a single domain event.
   *
   * @param event - The domain event to publish.
   */
  publish(event: DomainEvent): Promise<void>;
}
