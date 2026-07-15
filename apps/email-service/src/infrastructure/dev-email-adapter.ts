import { Logger } from '@nestjs/common';
import type { EmailSender } from '../domain/email-sender';

/**
 * Development implementation of the {@link EmailSender} port.
 *
 * Logs email content via the NestJS Logger instead of actually sending
 * emails. Useful for local development, testing, and CI environments
 * where a real email provider is not configured.
 *
 * To use a real email provider, swap the binding in `EmailModule` to a
 * different `EmailSender` implementation (e.g. SendGrid, SES, SMTP).
 */
export class DevEmailAdapter implements EmailSender {
  constructor(private readonly logger: Logger) {}

  /**
   * Logs the email to the console without sending it.
   *
   * @param to - The recipient email address.
   * @param subject - The email subject line.
   * @param _body - The email body (not logged in dev mode for brevity).
   */
  async send(to: string, subject: string, _body: string): Promise<void> {
    void _body; // Intentionally unused in dev mode
    this.logger.log(
      `[DevEmailAdapter] Sending email to=${to} subject="${subject}"`,
    );
  }
}
