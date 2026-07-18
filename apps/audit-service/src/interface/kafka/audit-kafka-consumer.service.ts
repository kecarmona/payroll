import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { AuditConsumer } from './audit-consumer';

/**
 * Kafka consumer that bridges the `payroll.events` topic into the audit service.
 *
 * Subscribes to the shared `payroll.events` topic and routes every incoming
 * message to the {@link AuditConsumer} for deserialization, validation, and
 * persistent audit record creation.
 *
 * ## Design notes
 *
 * - The consumer uses its own consumer group (`payroll-audit-group`) so that
 *   offset tracking is independent of other services consuming the same topic.
 * - Connection failures are logged but **do not crash** the application — the
 *   service starts without event processing and retries on next restart.
 * - Messages that fail to deserialize or validate are logged and **skipped**
 *   (the consumer does not commit offsets for failed messages; kafkajs
 *   retries them by default).
 *
 * @example
 * ```ts
 * // Registered in AppModule as a provider — lifecycle hooks handle
 * // connect/subscribe/disconnect automatically.
 * ```
 */
@Injectable()
export class AuditKafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditKafkaConsumerService.name);
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;
  private isRunning = false;

  constructor(
    private readonly auditConsumer: AuditConsumer,
  ) {
    const broker = process.env['KAFKA_BROKER'] ?? 'localhost:9092';

    this.kafka = new Kafka({
      clientId: 'payroll-audit-service',
      brokers: [broker],
    });

    this.consumer = this.kafka.consumer({
      groupId: 'payroll-audit-group',
    });
  }

  async onModuleInit(): Promise<void> {
    const maxRetries = 10;
    const baseDelayMs = 2_000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.consumer.connect();
        await this.consumer.subscribe({
          topic: 'payroll.events',
          fromBeginning: true,
        });

        await this.consumer.run({
          eachMessage: async (payload: EachMessagePayload) =>
            this.processMessage(payload),
        });

        this.isRunning = true;
        this.logger.log('Kafka consumer connected, subscribed to "payroll.events"');
        return;
      } catch (error) {
        const message = (error as Error).message;
        this.logger.warn(
          `Failed to connect to Kafka (attempt ${attempt}/${maxRetries}): ${message}`,
        );

        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          this.logger.warn(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          this.logger.error(
            `Failed to connect to Kafka after ${maxRetries} attempts: ${message}`,
          );
          this.logger.warn(
            'Kafka consumer will retry on next application restart. Service continues without event processing.',
          );
        }
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.isRunning = false;
    await this.consumer.disconnect();
    this.logger.log('Kafka consumer disconnected');
  }

  /**
   * Deserializes and processes a single message from `payroll.events`.
   *
   * Delegates to {@link AuditConsumer.handleAuditEvent} which performs
   * validation, redaction, and persistent storage. Errors are caught
   * and logged — they do not propagate to the Kafka consumer loop.
   */
  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { message, topic, partition } = payload;

    if (!message.value) {
      this.logger.warn('Received empty message, skipping');
      return;
    }

    try {
      await this.auditConsumer.handleAuditEvent(message);
      this.logger.log(
        `Processed audit event from ${topic}[${partition}]`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process message from ${topic}[${partition}]: ${(error as Error).message}`,
      );
    }
  }

  /** Whether the consumer is currently connected and running. */
  get connected(): boolean {
    return this.isRunning;
  }
}
