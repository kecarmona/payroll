import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import type { EventDeserializer } from '@payroll/event-bus';
import { ProjectionConsumerService } from './projection-consumer.service';

/**
 * Kafka consumer for the projection service.
 *
 * Subscribes to `payroll.events` topic and routes all incoming events
 * to the {@link ProjectionConsumerService} for projection updates.
 */
@Injectable()
export class ProjectionKafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProjectionKafkaConsumerService.name);
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;
  private isRunning = false;

  constructor(
    private readonly projectionConsumer: ProjectionConsumerService,
    @Inject('EventDeserializer') private readonly deserializer: EventDeserializer,
  ) {
    const broker = process.env['KAFKA_BROKER'] ?? 'localhost:9092';

    this.kafka = new Kafka({
      clientId: 'payroll-projection-service',
      brokers: [broker],
    });

    this.consumer = this.kafka.consumer({
      groupId: 'payroll-projection-group',
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

  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { message, topic, partition } = payload;

    if (!message.value) {
      this.logger.warn('Received empty message, skipping');
      return;
    }

    try {
      const envelope = this.deserializer.deserialize(message.value as Buffer);
      await this.projectionConsumer.processEvent(envelope);
      this.logger.debug(
        `Processed ${envelope.eventType} event [${envelope.eventId}] from ${topic}[${partition}]`,
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
