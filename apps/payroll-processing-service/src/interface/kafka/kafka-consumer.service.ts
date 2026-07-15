import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import type { EventDeserializer } from '@payroll/event-bus';
import type { EventHandler } from '@payroll/event-bus';

/**
 * Generic Kafka consumer service that subscribes to a topic, deserializes
 * incoming events, and routes them to the appropriate handler based on
 * the event type.
 *
 * Supports multiple handlers per topic — each handler declares which
 * event types it handles and only receives matching events.
 */
@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly kafka: Kafka;
  private readonly consumer: Consumer;
  private readonly handlers: Map<string, EventHandler> = new Map();
  private isRunning = false;

  constructor(
    private readonly config: {
      broker: string;
      clientId: string;
      groupId: string;
      topic: string;
    },
    private readonly deserializer: EventDeserializer,
  ) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: [config.broker],
    });

    this.consumer = this.kafka.consumer({
      groupId: config.groupId,
    });
  }

  /**
   * Registers an event handler for specific event types.
   *
   * @param handler - The event handler to register.
   */
  registerHandler(handler: EventHandler): void {
    this.handlers.set(handler.eventType, handler);
    this.logger.log(`Registered handler for event type: ${handler.eventType}`);
  }

  async onModuleInit(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: this.config.topic,
      fromBeginning: true,
    });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) =>
        this.processMessage(payload),
    });

    this.isRunning = true;
    this.logger.log(
      `Kafka consumer connected to ${this.config.broker}, subscribed to "${this.config.topic}"`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    this.isRunning = false;
    await this.consumer.disconnect();
    this.logger.log('Kafka consumer disconnected');
  }

  /**
   * Processes a single Kafka message: deserializes it and routes to
   * the matching handler.
   *
   * @param payload - The Kafka message payload.
   */
  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { message, topic, partition } = payload;

    if (!message.value) {
      this.logger.warn('Received empty message, skipping');
      return;
    }

    try {
      const envelope = this.deserializer.deserialize(message.value as Buffer);
      const handler = this.handlers.get(envelope.eventType);

      if (!handler) {
        this.logger.warn(`No handler registered for event type: ${envelope.eventType}`);
        return;
      }

      await handler.handle(envelope);
      this.logger.debug(
        `Processed ${envelope.eventType} event [${envelope.eventId}] from ${topic}[${partition}]`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process message from ${topic}[${partition}]: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
  }

  /** Whether the consumer is currently connected and running. */
  get connected(): boolean {
    return this.isRunning;
  }
}
