/**
 * Possible statuses for an email delivery.
 *
 * An email transitions from PENDING to SENT on success,
 * or PENDING to FAILED when the send operation cannot complete.
 */
export const EmailStatus = {
  /** The email has been created but not yet sent. */
  PENDING: 'PENDING',
  /** The email was successfully sent. */
  SENT: 'SENT',
  /** The email delivery failed. */
  FAILED: 'FAILED',
} as const;

/** Union type of all email status strings. */
export type EmailStatus = (typeof EmailStatus)[keyof typeof EmailStatus];
