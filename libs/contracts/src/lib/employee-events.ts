/**
 * Employee domain event types.
 *
 * These events represent employee lifecycle occurrences within the
 * Employee bounded context.
 *
 * @example
 * ```ts
 * import { EmployeeEventType } from '@payroll/contracts';
 * const eventType = EmployeeEventType.EMPLOYEE_CREATED; // 'employee.created'
 * ```
 */
export const EmployeeEventType = {
  /** A new employee has been registered in the system. */
  EMPLOYEE_CREATED: 'employee.created',
  /** An employee's data has been updated. */
  EMPLOYEE_UPDATED: 'employee.updated',
  /** An employee's salary has been modified. */
  EMPLOYEE_SALARY_CHANGED: 'employee.salary.changed',
  /** An employee's employment has been terminated. */
  EMPLOYEE_TERMINATED: 'employee.terminated',
} as const;

/** Union type of all employee event type strings. */
export type EmployeeEventType = (typeof EmployeeEventType)[keyof typeof EmployeeEventType];

/**
 * Payload for the EmployeeCreated domain event.
 */
export interface EmployeeCreatedPayload {
  /** The newly created employee's unique identifier. */
  readonly employeeId: string;
  /** The employee's full name. */
  readonly name: string;
  /** The employee's email address. */
  readonly email: string;
  /** The tenant (company) the employee belongs to. */
  readonly companyId: string;
  /** The employee's position/title. */
  readonly position: string;
  /** The employee's department. */
  readonly department: string;
  /** The initial salary in cents. */
  readonly salaryCents: number;
  /** The salary currency code. */
  readonly salaryCurrency: string;
}

/**
 * Payload for the EmployeeUpdated domain event.
 */
export interface EmployeeUpdatedPayload {
  /** The updated employee's unique identifier. */
  readonly employeeId: string;
  /** The tenant (company) the employee belongs to. */
  readonly companyId: string;
  /** The list of fields that were changed in this update. */
  readonly changedFields: string[];
  /** ISO timestamp when the update occurred. */
  readonly updatedAt: string;
}

/**
 * Payload for the EmployeeSalaryChanged domain event.
 */
export interface EmployeeSalaryChangedPayload {
  /** The employee's unique identifier. */
  readonly employeeId: string;
  /** The tenant (company) the employee belongs to. */
  readonly companyId: string;
  /** The previous salary in cents before the change. */
  readonly previousSalaryCents: number;
  /** The new salary in cents after the change. */
  readonly newSalaryCents: number;
  /** The salary currency code. */
  readonly currency: string;
  /** The effective date of the salary change. */
  readonly effectiveDate: string;
}

/**
 * Payload for the EmployeeTerminated domain event.
 */
export interface EmployeeTerminatedPayload {
  /** The terminated employee's unique identifier. */
  readonly employeeId: string;
  /** The tenant (company) the employee belongs to. */
  readonly companyId: string;
}

/**
 * Maps each employee event type to its corresponding payload interface.
 *
 * Useful for type-safe event handling:
 *
 * ```ts
 * function handleEmployeeEvent(eventType: EmployeeEventType, payload: EmployeeEventPayload[typeof eventType]) { ... }
 * ```
 */
export type EmployeeEventPayload = {
  [EmployeeEventType.EMPLOYEE_CREATED]: EmployeeCreatedPayload;
  [EmployeeEventType.EMPLOYEE_UPDATED]: EmployeeUpdatedPayload;
  [EmployeeEventType.EMPLOYEE_SALARY_CHANGED]: EmployeeSalaryChangedPayload;
  [EmployeeEventType.EMPLOYEE_TERMINATED]: EmployeeTerminatedPayload;
};
