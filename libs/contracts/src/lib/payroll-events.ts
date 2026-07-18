/**
 * Payroll domain event types.
 *
 * These events represent the payroll processing workflow occurrences
 * within the Payroll and Payroll Processing bounded contexts.
 *
 * @example
 * ```ts
 * import { PayrollEventType } from '@payroll/contracts';
 * const eventType = PayrollEventType.PayrollJobCreated; // 'PayrollJobCreated'
 * ```
 */
export const PayrollEventType = {
  /** A payroll job has been created for a company and period. */
  PayrollJobCreated: 'PayrollJobCreated',
  /** Payroll processing has started for a job. */
  PayrollJobProcessingStarted: 'PayrollJobProcessingStarted',
  /** A per-employee payroll transaction has been created. */
  PayrollTransactionCreated: 'PayrollTransactionCreated',
  /** Processing has started for an individual transaction. */
  PayrollTransactionProcessingStarted: 'PayrollTransactionProcessingStarted',
  /** An individual transaction completed successfully. */
  PayrollTransactionCompleted: 'PayrollTransactionCompleted',
  /** An individual transaction failed. */
  PayrollTransactionFailed: 'PayrollTransactionFailed',
  /** All transactions for a payroll job completed successfully. */
  PayrollJobCompleted: 'PayrollJobCompleted',
  /** The payroll job failed (one or more transactions unrecoverable). */
  PayrollJobFailed: 'PayrollJobFailed',
  /** A payslip has been generated for an employee. */
  PayslipGenerated: 'PayslipGenerated',
} as const;

/** Union type of all payroll event type strings. */
export type PayrollEventType = (typeof PayrollEventType)[keyof typeof PayrollEventType];

