import { randomUUID } from 'crypto';
import { PayrollEventType } from '@payroll/contracts';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the PayrollJobCreated domain event.
 *
 * Matches the contract schema defined in event-versions.ts (version 1).
 */
export interface PayrollJobCreatedPayload {
  /** The newly created payroll job's unique identifier. */
  readonly jobId: string;
  /** The tenant (company) this job belongs to. */
  readonly companyId: string;
  /** The payroll period identifier this job targets. */
  readonly periodId: string;
  /** Employee IDs to process in this job. */
  readonly employeeIds: string[];
  /** ISO timestamp when the job was created. */
  readonly timestamp: string;
}

/**
 * Domain event raised when a new payroll job is created.
 *
 * This event is recorded by the PayrollJob aggregate and later published
 * through the transactional outbox to trigger downstream processing.
 */
export class PayrollJobCreatedEvent
  implements DomainEvent<PayrollJobCreatedPayload>
{
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: PayrollJobCreatedPayload;

  constructor(payload: PayrollJobCreatedPayload) {
    this.eventId = randomUUID();
    this.eventType = PayrollEventType.PayrollJobCreated;
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.jobId;
    this.payload = payload;
  }
}
