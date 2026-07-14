import { PayrollEventType } from './payroll-events';
import { IdentityEventType } from './identity-events';
import { EmployeeEventType } from './employee-events';
import { NotificationEventType } from './notification-events';

/** Union of every known event type string across all bounded contexts. */
type AllEventTypes =
  | (typeof PayrollEventType)[keyof typeof PayrollEventType]
  | (typeof IdentityEventType)[keyof typeof IdentityEventType]
  | (typeof EmployeeEventType)[keyof typeof EmployeeEventType]
  | (typeof NotificationEventType)[keyof typeof NotificationEventType];

/**
 * Central registry of current schema versions for every domain event.
 *
 * Each event type maps to its current payload schema version number.
 * When an event's payload shape changes, increment the version number here.
 * This enables consumers to validate that they can process received events.
 *
 * The `satisfies Record<AllEventTypes, number>` constraint ensures that
 * adding a new event type to any domain module without adding its version
 * here causes a compile-time error.
 */
export const EVENT_VERSIONS = {
  // ── Payroll (9 events) ──────────────────────────────────────
  PayrollJobCreated: 1,
  PayrollJobProcessingStarted: 1,
  PayrollTransactionCreated: 1,
  PayrollTransactionProcessingStarted: 1,
  PayrollTransactionCompleted: 1,
  PayrollTransactionFailed: 1,
  PayrollJobCompleted: 1,
  PayrollJobFailed: 1,
  PayslipGenerated: 1,

  // ── Identity (4 events) ──────────────────────────────────────
  UserRegistered: 1,
  UserAuthenticated: 1,
  PasswordChanged: 1,
  UserDeactivated: 1,

  // ── Employee (4 events) ──────────────────────────────────────
  'employee.created': 1,
  'employee.updated': 1,
  'employee.salary.changed': 1,
  'employee.terminated': 1,

  // ── Notification (4 events) ──────────────────────────────────
  NotificationRequested: 1,
  EmailNotificationRequested: 1,
  EmailSent: 1,
  EmailFailed: 1,
} as const satisfies Record<AllEventTypes, number>;
