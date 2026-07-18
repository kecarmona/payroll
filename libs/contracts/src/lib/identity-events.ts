/**
 * Identity domain event types.
 *
 * These events represent authentication and account lifecycle occurrences
 * within the Identity bounded context.
 *
 * @example
 * ```ts
 * import { IdentityEventType } from '@payroll/contracts';
 * const eventType = IdentityEventType.UserRegistered; // 'UserRegistered'
 * ```
 */
export const IdentityEventType = {
  /** A new user account has been registered. */
  UserRegistered: 'UserRegistered',
  /** A user successfully authenticated. */
  UserAuthenticated: 'UserAuthenticated',
  /** A user's password has been changed/rotated. */
  PasswordChanged: 'PasswordChanged',
  /** A user account has been deactivated or disabled. */
  UserDeactivated: 'UserDeactivated',
} as const;

/** Union type of all identity event type strings. */
export type IdentityEventType = (typeof IdentityEventType)[keyof typeof IdentityEventType];
