import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Kafka, Producer } from 'kafkajs';
import { KafkaOutboxPublisher, kafkaConfigFromEnv } from '@payroll/transactional-outbox';
import type { EventSerializer, TopicRegistry } from '@payroll/event-bus';

const logger = new Logger('OutboxPublisherService');

/** Static topic registry — maps event types to Kafka topics. */
class StaticTopicRegistry implements TopicRegistry {
  resolve(eventType: string): string {
    return 'payroll.events';
  }
}

/** JSON-based event serializer. */
class JsonEventSerializer implements EventSerializer {
  serialize<TPayload>(event: import('@payroll/contracts').EventEnvelope<TPayload>): Buffer {
    return Buffer.from(JSON.stringify(event));
  }
}

/**
 * Background service that polls the transactional outbox table
 * and publishes pending events to Kafka.
 *
 * Runs every 5 seconds (configurable via OUTBOX_POLL_INTERVAL_MS env var).
 */
@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
  private publisher!: KafkaOutboxPublisher;
  private producer!: Producer;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit(): Promise<void> {
    const config = kafkaConfigFromEnv();

    const kafka = new Kafka({
      clientId: 'payroll-service-outbox',
      brokers: [config.broker],
    });

    this.producer = kafka.producer();
    await this.producer.connect();

    this.publisher = new KafkaOutboxPublisher(
      this.dataSource,
      this.producer,
      new JsonEventSerializer(),
      new StaticTopicRegistry(),
      config,
      logger,
    );

    // Start polling on the configured interval
    this.intervalId = setInterval(() => {
      this.publisher.publishPending().catch((err: Error) => {
        logger.error(`Outbox poll cycle failed: ${err.message}`);
      });
    }, config.pollIntervalMs);

    logger.log(`Outbox publisher started (interval: ${config.pollIntervalMs}ms, batch: ${config.batchSize})`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    await this.producer.disconnect();
    logger.log('Outbox publisher stopped');
  }
}
