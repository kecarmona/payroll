import { randomUUID } from 'crypto';
import { PayrollEventType } from '@payroll/contracts';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the PayrollTransactionCompleted domain event.
 *
 * Emitted when a payroll transaction calculation completes successfully,
 * carrying the computed monetary amounts.
 */
export interface PayrollTransactionCompletedPayload {
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
  /** Gross pay in cents. */
  readonly grossPayCents: number;
  /** Total deductions in cents. */
  readonly deductionsCents: number;
  /** Net pay in cents (gross - deductions). */
  readonly netPayCents: number;
  /** ISO 4217 currency code. */
  readonly currency: string;
  /** ISO timestamp when the transaction completed. */
  readonly timestamp: string;
}

/**
 * Domain event raised when a payroll transaction completes successfully.
 */
export class PayrollTransactionCompletedEvent
  implements DomainEvent<PayrollTransactionCompletedPayload>
{
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: PayrollTransactionCompletedPayload;

  constructor(payload: PayrollTransactionCompletedPayload) {
    this.eventId = randomUUID();
    this.eventType = PayrollEventType.PayrollTransactionCompleted;
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.transactionId;
    this.payload = payload;
  }
}
