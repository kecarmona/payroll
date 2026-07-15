import { Logger } from '@nestjs/common';
import type { EventEnvelope } from '@payroll/contracts';
import type { EmailSender } from '../domain/email-sender';

/**
 * Payload for the EmailNotificationRequested integration event.
 *
 * Produced by the Notification Service when a notification should
 * be delivered via email.
 */
export interface EmailNotificationRequestedPayload {
  readonly notificationId: string;
  readonly recipientId: string;
  readonly type: string;
  readonly companyId: string;
  readonly eventId: string;
}

/**
 * Command handler for processing EmailNotificationRequested events.
 *
 * When a notification requests email delivery, this handler:
 * 1. Sends an email via the configured EmailSender adapter
 * 2. Logs the result (success or failure)
 *
 * In production, this would also persist the EmailDelivery aggregate
 * and emit EmailSent/EmailFailed domain events via the outbox.
 */
export class HandleEmailNotification {
  constructor(
    private readonly emailSender: EmailSender,
    private readonly logger: Logger,
  ) {}

  /**
   * Handles an incoming EmailNotificationRequested integration event.
   *
   * @param event - The deserialized EmailNotificationRequested event envelope.
   */
  async handle(event: EventEnvelope<EmailNotificationRequestedPayload>): Promise<void> {
    const { recipientId, companyId } = event.payload;

    try {
      await this.emailSender.send(
        recipientId,
        'Your Payslip is Ready',
        `Dear employee,\n\nYour payslip for the current period is now available.\n\nCompany: ${companyId}\nEmployee ID: ${recipientId}`,
      );

      this.logger.log(
        `[HandleEmailNotification] Successfully sent email for event=${event.eventId}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `[HandleEmailNotification] Failed to send email for event=${event.eventId}`,
        errorMessage,
      );
    }
  }
}
