import { randomUUID } from 'crypto';
import type { EventEnvelope } from '@payroll/contracts';
import type { OutboxStore } from '@payroll/transactional-outbox';
import type { ProcessedEventStore } from '../domain/processed-event-store';
import { NotificationRequest } from '../domain/notification-request';
import { NotificationType } from '../domain/notification-type';

/**
 * Payload for the PayslipGenerated integration event.
 *
 * This event is produced by the Payroll Processing Service when
 * a payslip has been generated for an employee.
 */
export interface PayslipGeneratedPayload {
  readonly employeeId: string;
  readonly companyId: string;
  readonly period: string;
  readonly grossPayCents: number;
  readonly netPayCents: number;
  readonly currency: string;
  readonly payslipUrl: string;
}

/**
 * Command handler for processing PayslipGenerated events.
 *
 * When a payslip is generated, this handler:
 * 1. Checks if the event was already processed (idempotency via ProcessedEventStore)
 * 2. Creates a NotificationRequest aggregate targeting the employee
 * 3. Persists the resulting domain events (NotificationRequested,
 *    EmailNotificationRequested) to the transactional outbox
 * 4. Marks the event as processed
 */
export class HandlePayslipGenerated {
  constructor(
    private readonly processedEventStore: ProcessedEventStore,
    private readonly outboxStore: OutboxStore,
  ) {}

  /**
   * Handles an incoming PayslipGenerated integration event.
   *
   * @param event - The deserialized PayslipGenerated event envelope.
   * @throws If the outbox store fails to persist events.
   */
  async handle(event: EventEnvelope<PayslipGeneratedPayload>): Promise<void> {
    // Idempotency check — skip if already processed
    const alreadyProcessed = await this.processedEventStore.exists(event.eventId);
    if (alreadyProcessed) {
      return;
    }

    // Create the notification request aggregate
    const notificationId = randomUUID();
    const request = NotificationRequest.create(
      notificationId,
      event.eventId,
      NotificationType.EMAIL,
      event.payload.employeeId,
      event.companyId,
    );

    // Persist each recorded domain event to the outbox
    const domainEvents = request.pullEvents();
    for (const domainEvent of domainEvents) {
      await this.outboxStore.save({
        id: domainEvent.eventId,
        eventType: domainEvent.eventType,
        aggregateId: domainEvent.aggregateId,
        payload: domainEvent.payload,
      });
    }

    // Mark as processed
    await this.processedEventStore.markProcessed(event.eventId, notificationId);
  }
}
