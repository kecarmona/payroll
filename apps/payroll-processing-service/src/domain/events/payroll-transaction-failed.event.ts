import { randomUUID } from 'crypto';
import { PayrollEventType } from '@payroll/contracts';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the PayrollTransactionFailed domain event.
 *
 * Emitted when a payroll transaction calculation fails.
 */
export interface PayrollTransactionFailedPayload {
  /** The transaction's unique identifier. */
  readonly transactionId: string;
  /** The parent payroll job identifier. */
  readonly jobId: string;
  /** The employee this transaction is for. */
  readonly employeeId: string;
  /** The tenant (company) this transaction belongs to. */
  readonly companyId: string;
  /** The payroll period identifier. */
  readonly periodId: string;
  /** Human-readable reason for the failure. */
  readonly reason: string;
  /** ISO timestamp when the transaction failed. */
  readonly timestamp: string;
}

/**
 * Domain event raised when a payroll transaction fails.
 *
 * This is a terminal event for the transaction — no further processing
 * will be attempted for this transaction.
 */
export class PayrollTransactionFailedEvent
  implements DomainEvent<PayrollTransactionFailedPayload>
{
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: PayrollTransactionFailedPayload;

  constructor(payload: PayrollTransactionFailedPayload) {
    this.eventId = randomUUID();
    this.eventType = PayrollEventType.PayrollTransactionFailed;
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.transactionId;
    this.payload = payload;
  }
}
