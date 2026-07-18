import { randomUUID } from 'crypto';
import { EmployeeEventType } from '@payroll/contracts';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the EmployeeCreated domain event.
 */
export interface EmployeeCreatedEventPayload {
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
 * Domain event raised when a new employee is registered in the system.
 *
 * @example
 * ```ts
 * const event = new EmployeeCreatedEvent({
 *   employeeId: 'emp-123',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   companyId: 'comp-1',
 *   position: 'Engineer',
 *   department: 'Engineering',
 *   salaryCents: 500000,
 *   salaryCurrency: 'USD',
 * });
 * ```
 */
export class EmployeeCreatedEvent implements DomainEvent<EmployeeCreatedEventPayload> {
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: EmployeeCreatedEventPayload;

  constructor(payload: EmployeeCreatedEventPayload) {
    this.eventId = randomUUID();
    this.eventType = EmployeeEventType.EMPLOYEE_CREATED;
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.employeeId;
    this.payload = payload;
  }
}
