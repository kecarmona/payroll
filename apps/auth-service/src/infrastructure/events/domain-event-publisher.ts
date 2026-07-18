import { Logger } from '@nestjs/common';
import type { EventPublisher } from '../../domain/event-publisher';

/**
 * Infrastructure implementation of the domain EventPublisher port.
 *
 * Currently logs events to the console. In a future phase, this will
 * bridge to the transactional outbox + Kafka publisher for reliable
 * event delivery across bounded contexts.
 *
 * @remarks
 * This is a temporary implementation. The real implementation will:
 * 1. Convert DomainEvent → EventEnvelope using the event-bus serializer
 * 2. Persist the envelope in the transactional outbox table
 * 3. Return — the outbox publisher handles the actual Kafka delivery
 */
export class DomainEventPublisherImpl implements EventPublisher {
  private readonly logger = new Logger(DomainEventPublisherImpl.name);

  /**
   * Publishes a domain event.
   *
   * Currently logs the event. Will be replaced with outbox-based
   * publishing once the transactional outbox infrastructure is in place.
   *
   * @param event - The domain event to publish.
   */
  async publish(event: import('@payroll/shared-kernel').DomainEvent): Promise<void> {
    this.logger.debug(
      `Publishing domain event: ${event.constructor.name} (aggregateId: ${event.aggregateId})`,
    );
  }
}
