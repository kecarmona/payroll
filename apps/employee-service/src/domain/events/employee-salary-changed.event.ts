import { randomUUID } from 'crypto';
import { EmployeeEventType } from '@payroll/contracts';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the EmployeeSalaryChanged domain event.
 */
export interface EmployeeSalaryChangedEventPayload {
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
 * Domain event raised when an employee's salary changes.
 *
 * @example
 * ```ts
 * const event = new EmployeeSalaryChangedEvent({
 *   employeeId: 'emp-123',
 *   companyId: 'comp-1',
 *   previousSalaryCents: 400000,
 *   newSalaryCents: 500000,
 *   currency: 'USD',
 *   effectiveDate: '2026-07-01',
 * });
 * ```
 */
export class EmployeeSalaryChangedEvent
  implements DomainEvent<EmployeeSalaryChangedEventPayload>
{
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: EmployeeSalaryChangedEventPayload;

  constructor(payload: EmployeeSalaryChangedEventPayload) {
    this.eventId = randomUUID();
    this.eventType = EmployeeEventType.EMPLOYEE_SALARY_CHANGED;
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.employeeId;
    this.payload = payload;
  }
}
