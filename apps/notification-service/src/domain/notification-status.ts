/**
 * Possible statuses for a notification request.
 *
 * A notification transitions from PENDING to SENT on success,
 * or PENDING to FAILED when delivery cannot be completed.
 */
export const NotificationStatus = {
  /** The notification has been created but not yet delivered. */
  PENDING: 'PENDING',
  /** The notification was successfully delivered. */
  SENT: 'SENT',
  /** The notification delivery failed. */
  FAILED: 'FAILED',
} as const;

/** Union type of all notification status strings. */
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];
