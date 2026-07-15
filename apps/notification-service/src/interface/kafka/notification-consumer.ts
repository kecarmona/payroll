import { Logger } from '@nestjs/common';
import type { EventDeserializer } from '@payroll/event-bus';
import type { EventEnvelope } from '@payroll/contracts';
import type { HandlePayslipGenerated, PayslipGeneratedPayload } from '../../application/handle-payslip-generated';

/**
 * Kafka consumer adapter for the Notification Service.
 *
 * Subscribes to the `payroll.events` Kafka topic and routes incoming
 * PayslipGenerated events to the {@link HandlePayslipGenerated} command handler.
 *
 * This is a minimal consumer that expects to be wired into a long-running
 * Kafka consumer loop managed by the application bootstrap. In production,
 * this would be integrated with the application's Kafka consumer group.
 *
 * @example
 * ```ts
 * // In application bootstrap:
 * const consumer = app.get(NotificationConsumer);
 * await consumer.start();
 * ```
 */
export class NotificationConsumer {
  constructor(
    private readonly handlePayslipGenerated: HandlePayslipGenerated,
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
        `[NotificationConsumer] Failed to deserialize message from topic=${topic}: ${errorMessage}`,
      );
      return;
    }

    if (envelope.eventType === 'PayslipGenerated') {
      await this.handlePayslipGenerated.handle(
        envelope as EventEnvelope<PayslipGeneratedPayload>,
      );
    } else {
      this.logger.log(
        `[NotificationConsumer] Ignoring event type=${envelope.eventType} from topic=${topic}`,
      );
    }
  }
}
