/**
 * Port interface for sending emails.
 *
 * Defines the contract that an email sender adapter must fulfill.
 * Implementations can vary — development (log-based), SMTP, SendGrid,
 * SES, etc.
 */
export interface EmailSender {
  /**
   * Sends an email with the given parameters.
   *
   * @param to - The recipient email address.
   * @param subject - The email subject line.
   * @param body - The email body content (plain text or HTML).
   * @throws If the email could not be sent.
   */
  send(to: string, subject: string, body: string): Promise<void>;
}
