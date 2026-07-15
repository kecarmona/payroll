import { randomUUID } from 'crypto';
import { PayrollEventType } from '@payroll/contracts';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the PayslipGenerated domain event.
 *
 * Emitted after a payroll transaction completes successfully and
 * the corresponding payslip is created.
 */
export interface PayslipGeneratedPayload {
  /** The payslip's unique identifier. */
  readonly payslipId: string;
  /** The transaction this payslip is for. */
  readonly transactionId: string;
  /** The parent payroll job identifier. */
  readonly jobId: string;
  /** The employee this payslip is for. */
  readonly employeeId: string;
  /** The tenant (company) this payslip belongs to. */
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
  /** ISO timestamp when the payslip was generated. */
  readonly timestamp: string;
}

/**
 * Domain event raised when a payslip is generated after a successful
 * payroll transaction.
 */
export class PayslipGeneratedEvent
  implements DomainEvent<PayslipGeneratedPayload>
{
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: PayslipGeneratedPayload;

  constructor(payload: PayslipGeneratedPayload) {
    this.eventId = randomUUID();
    this.eventType = PayrollEventType.PayslipGenerated;
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.payslipId;
    this.payload = payload;
  }
}
