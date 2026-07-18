import { randomUUID } from 'crypto';
import { PayrollEventType } from '@payroll/contracts';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the PayrollTransactionCreated domain event.
 *
 * Emitted when a per-employee payroll transaction is first created
 * after a PayrollJobCreated event is consumed.
 */
export interface PayrollTransactionCreatedPayload {
  /** The newly created transaction's unique identifier. */
  readonly transactionId: string;
  /** The parent payroll job identifier. */
  readonly jobId: string;
  /** The employee this transaction is for. */
  readonly employeeId: string;
  /** The tenant (company) this transaction belongs to. */
  readonly companyId: string;
  /** The payroll period identifier. */
  readonly periodId: string;
  /** ISO timestamp when the transaction was created. */
  readonly timestamp: string;
}

/**
 * Domain event raised when a new payroll transaction is created.
 *
 * This event is recorded by the PayrollTransaction aggregate and later
 * published through the transactional outbox.
 */
export class PayrollTransactionCreatedEvent
  implements DomainEvent<PayrollTransactionCreatedPayload>
{
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: PayrollTransactionCreatedPayload;

  constructor(payload: PayrollTransactionCreatedPayload) {
    this.eventId = randomUUID();
    this.eventType = PayrollEventType.PayrollTransactionCreated;
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.transactionId;
    this.payload = payload;
  }
}
