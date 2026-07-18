import { Injectable, Logger } from '@nestjs/common';
import type { RecordAuditEventHandler } from '../../application/record-audit-event.handler';

/**
 * Raw Kafka message shape received by the consumer.
 */
interface KafkaMessage {
  /** The raw buffer containing the serialized event envelope. */
  readonly value: Buffer | null;
}

/**
 * Shape of the event envelope expected on the `audit.events` topic.
 */
interface AuditEventEnvelope {
  readonly eventId: string;
  readonly eventType: string;
  readonly companyId: string;
  readonly correlationId: string;
  readonly timestamp: string;
  readonly payload: Record<string, unknown>;
}

/**
 * Kafka consumer for the `audit.events` topic.
 *
 * This consumer deserializes incoming Kafka messages, validates the
 * required fields, and delegates to the {@link RecordAuditEventHandler}
 * for processing.
 *
 * The consumer is designed to be used with the Kafka consumer group
 * pattern. Each message is processed atomically — if the handler throws,
 * the consumer should retry or move to a dead-letter topic.
 *
 * ## Audited Event Types
 *
 * The following event types are audited (all consumed from `audit.events`):
 * - UserRoleChanged, EmployeeCreated, EmployeeSalaryChanged, EmployeeTerminated
 * - PayrollJobCreated, PayrollJobCompleted, PayrollJobFailed
 * - PayrollTransactionCompleted, PayrollTransactionFailed
 * - PayslipGenerated
 */
@Injectable()
export class AuditConsumer {
  private readonly logger = new Logger(AuditConsumer.name);

  constructor(
    private readonly handler: RecordAuditEventHandler,
  ) {}

  /**
   * Processes a single Kafka message from the `audit.events` topic.
   *
   * Deserializes the JSON envelope, validates required fields, and
   * delegates to the audit event handler.
   *
   * @param message - The Kafka message to process.
   * @throws {Error} If the message is empty, invalid JSON, or missing
   *                 required fields.
   */
  async handleAuditEvent(message: KafkaMessage): Promise<void> {
    if (!message.value || message.value.length === 0) {
      throw new Error('Empty message received on audit.events topic');
    }

    let envelope: AuditEventEnvelope;

    try {
      const raw = message.value.toString('utf8');
      envelope = JSON.parse(raw) as AuditEventEnvelope;
    } catch {
      throw new Error('Failed to deserialize audit event message');
    }

    // Validate required fields
    if (!envelope.eventId || !envelope.eventType || !envelope.companyId || !envelope.payload) {
      throw new Error(
        `Audit event missing required fields: eventId=${!!envelope.eventId}, eventType=${!!envelope.eventType}, companyId=${!!envelope.companyId}, payload=${!!envelope.payload}`,
      );
    }

    this.logger.debug(`Processing audit event: ${envelope.eventType} (${envelope.eventId})`);

    await this.handler.handle({
      eventId: envelope.eventId,
      eventType: envelope.eventType,
      companyId: envelope.companyId,
      correlationId: envelope.correlationId ?? '',
      payload: envelope.payload,
      occurredAt: new Date(envelope.timestamp),
    });
  }
}
