import { Logger } from '@nestjs/common';
import type { EventDeserializer } from '@payroll/event-bus';
import type { EventEnvelope } from '@payroll/contracts';
import type { HandleEmailNotification, EmailNotificationRequestedPayload } from '../../application/handle-email-notification';

/**
 * Kafka consumer adapter for the Email Service.
 *
 * Subscribes to the `notification.events` Kafka topic and routes incoming
 * EmailNotificationRequested events to the {@link HandleEmailNotification}
 * command handler.
 *
 * This is a minimal consumer that expects to be wired into a long-running
 * Kafka consumer loop managed by the application bootstrap.
 *
 * @example
 * ```ts
 * // In application bootstrap:
 * const consumer = app.get(EmailConsumer);
 * await consumer.start();
 * ```
 */
export class EmailConsumer {
  constructor(
    private readonly handleEmailNotification: HandleEmailNotification,
    private readonly deserializer: EventDeserializer,
    private readonly logger: Logger,
  ) {}

  /**
   * Processes a single raw Kafka message.
   *
   * Deserializes the message buffer into an EventEnvelope, checks
   * the event type, and routes to the appropriate handler.
   *
   * @param topic - The Kafka topic the message was received from.
   * @param raw - The raw message buffer from Kafka.
   */
  async processMessage(topic: string, raw: Buffer): Promise<void> {
    let envelope: EventEnvelope;

    try {
      envelope = this.deserializer.deserialize(raw);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `[EmailConsumer] Failed to deserialize message from topic=${topic}: ${errorMessage}`,
      );
      return;
    }

    if (envelope.eventType === 'EmailNotificationRequested') {
      await this.handleEmailNotification.handle(
        envelope as EventEnvelope<EmailNotificationRequestedPayload>,
      );
    } else {
      this.logger.log(
        `[EmailConsumer] Ignoring event type=${envelope.eventType} from topic=${topic}`,
      );
    }
  }
}
