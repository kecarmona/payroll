import { randomUUID } from 'crypto';
import { EmployeeEventType } from '@payroll/contracts';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the EmployeeUpdated domain event.
 */
export interface EmployeeUpdatedEventPayload {
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
 * Domain event raised when an employee's data is updated.
 *
 * @example
 * ```ts
 * const event = new EmployeeUpdatedEvent({
 *   employeeId: 'emp-123',
 *   companyId: 'comp-1',
 *   changedFields: ['name', 'position'],
 *   updatedAt: '2026-07-14T12:00:00.000Z',
 * });
 * ```
 */
export class EmployeeUpdatedEvent implements DomainEvent<EmployeeUpdatedEventPayload> {
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: EmployeeUpdatedEventPayload;

  constructor(payload: EmployeeUpdatedEventPayload) {
    this.eventId = randomUUID();
    this.eventType = EmployeeEventType.EMPLOYEE_UPDATED;
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.employeeId;
    this.payload = payload;
  }
}
