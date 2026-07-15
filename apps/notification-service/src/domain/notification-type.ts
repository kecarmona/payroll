/**
 * Supported notification channel types.
 *
 * Currently only EMAIL is defined. Future types could include
 * SMS, PUSH, or in-app notifications.
 */
export const NotificationType = {
  /** Email notification delivered via the Email Service. */
  EMAIL: 'EMAIL',
} as const;

/** Union type of all notification type strings. */
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
