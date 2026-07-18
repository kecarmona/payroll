import { randomUUID } from 'crypto';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the PayrollPeriodCreated domain event.
 */
export interface PayrollPeriodCreatedPayload {
  /** The newly created payroll period's unique identifier. */
  readonly periodId: string;
  /** The tenant (company) this period belongs to. */
  readonly companyId: string;
  /** The month (1-12) this payroll period covers. */
  readonly month: number;
  /** The year this payroll period covers. */
  readonly year: number;
  /** The start date of the payroll period. */
  readonly startDate: string;
  /** The end date of the payroll period. */
  readonly endDate: string;
}

/**
 * Domain event raised when a new payroll period is created.
 */
export class PayrollPeriodCreatedEvent
  implements DomainEvent<PayrollPeriodCreatedPayload>
{
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: PayrollPeriodCreatedPayload;

  constructor(payload: PayrollPeriodCreatedPayload) {
    this.eventId = randomUUID();
    this.eventType = 'PayrollPeriodCreated';
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.periodId;
    this.payload = payload;
  }
}
