import { AggregateRoot } from '@payroll/shared-kernel';
import { EmailStatus } from './email-status';

/**
 * Aggregate representing an individual email delivery within the
 * Email bounded context.
 *
 * An EmailDelivery is created when an EmailNotificationRequested event
 * is consumed. It tracks the delivery status and retry count for
 * observability and resilience.
 */
export class EmailDelivery extends AggregateRoot<string> {
  private constructor(
    id: string,
    private readonly _to: string,
    private readonly _subject: string,
    private readonly _body: string,
    private _status: EmailStatus,
    companyId: string,
    private readonly _createdAt: Date,
    version: number,
    private _retryCount: number,
  ) {
    super(id, companyId, version);
  }

  /**
   * Creates a new EmailDelivery with PENDING status.
   *
   * @param id - Unique identifier for this email delivery.
   * @param to - The recipient email address.
   * @param subject - The email subject line.
   * @param body - The email body content.
   * @param companyId - The tenant (company) this delivery belongs to.
   * @returns A new EmailDelivery aggregate with PENDING status.
   */
  static create(
    id: string,
    to: string,
    subject: string,
    body: string,
    companyId: string,
  ): EmailDelivery {
    return new EmailDelivery(
      id,
      to,
      subject,
      body,
      EmailStatus.PENDING,
      companyId,
      new Date(),
      0,
      0,
    );
  }

  /**
   * Reconstitutes an existing EmailDelivery from persistence data.
   *
   * Used by repositories when loading the aggregate from the database.
   *
   * @param id - The unique identifier.
   * @param to - The recipient email address.
   * @param subject - The email subject line.
   * @param body - The email body content.
   * @param status - The current delivery status.
   * @param companyId - The tenant identifier.
   * @param createdAt - When the email delivery was created.
   * @param version - The optimistic concurrency version.
   * @param retryCount - The number of delivery attempts made.
   * @returns A reconstituted EmailDelivery with no pending events.
   */
  static reconstitute(
    id: string,
    to: string,
    subject: string,
    body: string,
    status: EmailStatus,
    companyId: string,
    createdAt: Date,
    version: number,
    retryCount: number,
  ): EmailDelivery {
    return new EmailDelivery(
      id,
      to,
      subject,
      body,
      status,
      companyId,
      createdAt,
      version,
      retryCount,
    );
  }

  /** The recipient email address. */
  get to(): string {
    return this._to;
  }

  /** The email subject line. */
  get subject(): string {
    return this._subject;
  }

  /** The email body content. */
  get body(): string {
    return this._body;
  }

  /** The current delivery status. */
  get status(): EmailStatus {
    return this._status;
  }

  /** Timestamp when the email delivery was created. */
  get createdAt(): Date {
    return this._createdAt;
  }

  /** The number of delivery attempts made. */
  get retryCount(): number {
    return this._retryCount;
  }

  /**
   * Marks the email as successfully sent.
   */
  markSent(): void {
    this._status = EmailStatus.SENT;
  }

  /**
   * Marks the email delivery as failed and increments the retry count.
   */
  markFailed(): void {
    this._status = EmailStatus.FAILED;
    this._retryCount += 1;
  }
}
