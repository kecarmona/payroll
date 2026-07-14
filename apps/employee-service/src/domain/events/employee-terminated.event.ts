import { randomUUID } from 'crypto';
import { EmployeeEventType } from '@payroll/contracts';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the EmployeeTerminated domain event.
 */
export interface EmployeeTerminatedEventPayload {
  /** The terminated employee's unique identifier. */
  readonly employeeId: string;
  /** The tenant (company) the employee belongs to. */
  readonly companyId: string;
  /** ISO timestamp when the termination occurred. */
  readonly terminatedAt: string;
}

/**
 * Domain event raised when an employee's employment is terminated.
 *
 * @example
 * ```ts
 * const event = new EmployeeTerminatedEvent({
 *   employeeId: 'emp-123',
 *   companyId: 'comp-1',
 * });
 * ```
 */
export class EmployeeTerminatedEvent
  implements DomainEvent<EmployeeTerminatedEventPayload>
{
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: EmployeeTerminatedEventPayload;

  constructor(payload: Omit<EmployeeTerminatedEventPayload, 'terminatedAt'>) {
    this.eventId = randomUUID();
    this.eventType = EmployeeEventType.EMPLOYEE_TERMINATED;
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.employeeId;
    this.payload = { ...payload, terminatedAt: this.occurredAt.toISOString() };
  }
}
