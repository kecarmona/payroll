import { randomUUID } from 'crypto';
import { PayrollEventType } from '@payroll/contracts';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the PayrollJobCompleted domain event.
 *
 * Emitted when all transactions for a payroll job have been successfully
 * created and processing has been initiated for the job.
 */
export interface PayrollJobCompletedPayload {
  /** The payroll job that completed. */
  readonly jobId: string;
  /** The tenant (company) this job belongs to. */
  readonly companyId: string;
  /** The payroll period identifier. */
  readonly periodId: string;
  /** ISO timestamp when the job completed. */
  readonly timestamp: string;
}

/**
 * Domain event raised when a payroll job has completed processing.
 *
 * This event signals downstream services (projections, notifications)
 * that all per-employee transactions for this job have been created.
 */
export class PayrollJobCompletedEvent
  implements DomainEvent<PayrollJobCompletedPayload>
{
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: PayrollJobCompletedPayload;

  constructor(payload: PayrollJobCompletedPayload) {
    this.eventId = randomUUID();
    this.eventType = PayrollEventType.PayrollJobCompleted;
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.jobId;
    this.payload = payload;
  }
}
