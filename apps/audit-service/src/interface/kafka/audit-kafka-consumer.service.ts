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
    } catch (error) {
      this.logger.error(
        `Failed to connect to Kafka: ${(error as Error).message}`,
      );
      this.logger.warn(
        'Kafka consumer will retry on next application restart. Service continues without event processing.',
      );
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
      this.logger.debug(
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
