/**
 * Employee domain event types.
 *
 * These events represent employee lifecycle occurrences within the
 * Employee bounded context.
 *
 * @example
 * ```ts
 * import { EmployeeEventType } from '@payroll/contracts';
 * const eventType = EmployeeEventType.EmployeeCreated; // 'EmployeeCreated'
 * ```
 */
export const EmployeeEventType = {
  /** A new employee has been registered in the system. */
  EmployeeCreated: 'EmployeeCreated',
  /** An employee's salary has been modified. */
  EmployeeSalaryChanged: 'EmployeeSalaryChanged',
  /** An employee's employment has been terminated. */
  EmployeeTerminated: 'EmployeeTerminated',
} as const;

/** Union type of all employee event type strings. */
export type EmployeeEventType = (typeof EmployeeEventType)[keyof typeof EmployeeEventType];
