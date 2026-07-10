/**
 * Notification domain event types.
 *
 * These events represent notification and email delivery occurrences
 * within the Notification bounded context.
 *
 * @example
 * ```ts
 * import { NotificationEventType } from '@payroll/contracts';
 * const eventType = NotificationEventType.EmailSent; // 'EmailSent'
 * ```
 */
export const NotificationEventType = {
  /** A generic notification has been requested for a user. */
  NotificationRequested: 'NotificationRequested',
  /** An email notification has been requested for delivery. */
  EmailNotificationRequested: 'EmailNotificationRequested',
  /** An email was successfully delivered. */
  EmailSent: 'EmailSent',
  /** An email delivery attempt failed. */
  EmailFailed: 'EmailFailed',
} as const;

/** Union type of all notification event type strings. */
export type NotificationEventType = (typeof NotificationEventType)[keyof typeof NotificationEventType];
