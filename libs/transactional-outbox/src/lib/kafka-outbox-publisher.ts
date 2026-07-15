import { Logger } from '@nestjs/common';
import { DataSource, IsNull, Repository } from 'typeorm';
import type { Producer } from 'kafkajs';
import type { EventEnvelope } from '@payroll/contracts';
import type { EventSerializer } from '@payroll/event-bus';
import type { TopicRegistry } from '@payroll/event-bus';
import type { OutboxPublisher } from './outbox-publisher';
import { TypeOrmOutboxEntity } from './typeorm-outbox.entity';
import type { KafkaConfig } from './kafka.config';

/**
 * Kafka-backed implementation of the {@link OutboxPublisher} port.
 *
 * Polls the `outbox` table for unpublished records (`publishedAt IS NULL`),
 * serializes each via {@link EventSerializer}, publishes the serialized
 * message to a Kafka topic resolved via {@link TopicRegistry}, and marks
 * the record as published on success.
 *
 * On failure, increments the retry count and stores the error message for
 * observability. The record will be retried on the next poll cycle.
 *
 * @remarks
 * This class is NOT a NestJS `@Injectable()` — it is instantiated manually
 * by the consuming application so that all dependencies (DataSource,
 * Producer, etc.) are explicitly provided rather than discovered by DI.
 */
export class KafkaOutboxPublisher implements OutboxPublisher {
  private readonly repository: Repository<TypeOrmOutboxEntity>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly producer: Producer,
    private readonly serializer: EventSerializer,
    private readonly topicRegistry: TopicRegistry,
    private readonly config: KafkaConfig,
    private readonly logger: Logger,
  ) {
    this.repository = dataSource.getRepository(TypeOrmOutboxEntity);
  }

  /**
   * Polls the outbox for unpublished records and publishes each one to Kafka.
   *
   * For each pending record:
   * 1. Resolves the Kafka topic via {@link TopicRegistry}
   * 2. Serializes an {@link EventEnvelope} via {@link EventSerializer}
   * 3. Sends the message to Kafka via the configured producer
   * 4. On success — updates `publishedAt` to now
   * 5. On failure — increments `retryCount`, stores `lastError`, logs a warning
   *
   * Processing continues to the next record even if one fails, ensuring
   * a single bad record does not block the entire batch.
   */
  async publishPending(): Promise<void> {
    const records = await this.repository.find({
      where: { publishedAt: IsNull() },
      order: { createdAt: 'ASC' },
      take: this.config.batchSize,
    });

    if (records.length === 0) {
      return;
    }

    this.logger.log(`Outbox publisher found ${records.length} pending record(s)`);

    for (const record of records) {
      try {
        // Build the event envelope for serialization
        const envelope: EventEnvelope = {
          eventId: record.id,
          eventType: record.eventType,
          version: 1,
          timestamp: record.createdAt.toISOString(),
          companyId: '',
          correlationId: record.id,
          causationId: record.id,
          producer: 'payroll-service',
          payload: record.payload,
        };

        const topic = this.topicRegistry.resolve(record.eventType);
        const serialized = this.serializer.serialize(envelope);

        await this.producer.send({
          topic,
          messages: [{ value: serialized }],
        });

        // Mark as published
        await this.repository.update(
          { id: record.id },
          { publishedAt: new Date() },
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `Failed to publish outbox record ${record.id}: ${errorMessage}`,
        );

        await this.repository.update(
          { id: record.id },
          {
            retryCount: record.retryCount + 1,
            lastError: errorMessage,
          },
        );
      }
    }
  }
}
