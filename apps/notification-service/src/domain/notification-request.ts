import { randomUUID } from 'crypto';
import { AggregateRoot } from '@payroll/shared-kernel';
import { NotificationStatus } from './notification-status';
import { NotificationType } from './notification-type';

/**
 * Payload for the NotificationRequested domain event.
 */
export interface NotificationRequestedPayload {
  readonly notificationId: string;
  readonly recipientId: string;
  readonly type: string;
  readonly companyId: string;
  readonly eventId: string;
}

/**
 * Payload for the EmailNotificationRequested domain event.
 */
export interface EmailNotificationRequestedPayload {
  readonly notificationId: string;
  readonly recipientId: string;
  readonly type: string;
  readonly companyId: string;
  readonly eventId: string;
}

/**
 * Aggregate representing a notification request within the Notification
 * bounded context.
 *
 * A NotificationRequest is created when a domain event (e.g. PayslipGenerated)
 * triggers the need to notify a user. It tracks the delivery status and
 * records domain events for outbox-based publication.
 */
export class NotificationRequest extends AggregateRoot<string> {
  private constructor(
    id: string,
    private readonly _eventId: string,
    private readonly _type: NotificationType,
    private readonly _recipientId: string,
    private _status: NotificationStatus,
    companyId: string,
    private readonly _createdAt: Date,
    version: number,
  ) {
    super(id, companyId, version);
  }

  /**
   * Creates a new NotificationRequest as the result of a domain event.
   *
   * Automatically records both `NotificationRequested` and
   * `EmailNotificationRequested` domain events for outbox publication.
   *
   * @param id - Unique identifier for this notification request.
   * @param eventId - The domain event ID that triggered this notification.
   * @param type - The notification channel type (e.g. EMAIL).
   * @param recipientId - The target recipient identifier.
   * @param companyId - The tenant (company) this notification belongs to.
   * @returns A new NotificationRequest aggregate with PENDING status.
   */
  static create(
    id: string,
    eventId: string,
    type: NotificationType,
    recipientId: string,
    companyId: string,
  ): NotificationRequest {
    const request = new NotificationRequest(
      id,
      eventId,
      type,
      recipientId,
      NotificationStatus.PENDING,
      companyId,
      new Date(),
      0,
    );

    // Record domain events for outbox publication
    request.recordEvent({
      eventId: randomUUID(),
      eventType: 'NotificationRequested',
      version: 1,
      occurredAt: new Date(),
      companyId,
      aggregateId: id,
      payload: {
        notificationId: id,
        recipientId,
        type,
        companyId,
        eventId,
      } satisfies NotificationRequestedPayload,
    });

    request.recordEvent({
      eventId: randomUUID(),
      eventType: 'EmailNotificationRequested',
      version: 1,
      occurredAt: new Date(),
      companyId,
      aggregateId: id,
      payload: {
        notificationId: id,
        recipientId,
        type,
        companyId,
        eventId,
      } satisfies EmailNotificationRequestedPayload,
    });

    return request;
  }

  /**
   * Reconstitutes an existing NotificationRequest from persistence data.
   *
   * Used by repositories when loading the aggregate from the database.
   * Does NOT record any domain events — it assumes the events were already
   * published when the aggregate was originally created.
   *
   * @param id - The unique identifier.
   * @param eventId - The domain event that triggered this notification.
   * @param type - The notification channel type.
   * @param recipientId - The target recipient identifier.
   * @param status - The current delivery status.
   * @param companyId - The tenant identifier.
   * @param createdAt - When the notification request was created.
   * @param version - The optimistic concurrency version.
   * @returns A reconstituted NotificationRequest with no pending events.
   */
  static reconstitute(
    id: string,
    eventId: string,
    type: NotificationType,
    recipientId: string,
    status: NotificationStatus,
    companyId: string,
    createdAt: Date,
    version: number,
  ): NotificationRequest {
    const request = new NotificationRequest(
      id,
      eventId,
      type,
      recipientId,
      status,
      companyId,
      createdAt,
      version,
    );
    // Clear any events recorded during construction (there are none in this
    // path, but being explicit protects against future constructor changes).
    request.clearEvents();
    return request;
  }

  /** The domain event ID that triggered this notification request. */
  get eventId(): string {
    return this._eventId;
  }

  /** The notification channel type (e.g. EMAIL). */
  get type(): NotificationType {
    return this._type;
  }

  /** The target recipient identifier. */
  get recipientId(): string {
    return this._recipientId;
  }

  /** The current delivery status. */
  get status(): NotificationStatus {
    return this._status;
  }

  /** Timestamp when the notification request was created. */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Marks the notification as successfully sent.
   */
  markSent(): void {
    this._status = NotificationStatus.SENT;
  }

  /**
   * Marks the notification as failed.
   */
  markFailed(): void {
    this._status = NotificationStatus.FAILED;
  }
}
