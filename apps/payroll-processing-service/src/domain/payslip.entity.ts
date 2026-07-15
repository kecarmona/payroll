import { Money } from '@payroll/shared-kernel';

/**
 * Immutable payslip generated after a successful payroll transaction.
 *
 * A payslip is a value-oriented entity — once created it is never modified.
 * The constructor validates that all monetary amounts share the same currency.
 */
export class Payslip {
  /** The payslip's unique identifier. */
  readonly id: string;

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

  /** Gross pay amount. */
  readonly grossPay: Money;

  /** Total deductions amount. */
  readonly deductions: Money;

  /** Net pay amount (gross minus deductions). */
  readonly netPay: Money;

  /** Timestamp when the payslip was generated. */
  readonly generatedAt: Date;

  constructor(
    id: string,
    transactionId: string,
    jobId: string,
    employeeId: string,
    companyId: string,
    periodId: string,
    grossPay: Money,
    deductions: Money,
    netPay: Money,
  ) {
    // Validate currency consistency
    if (
      grossPay.currency !== deductions.currency ||
      grossPay.currency !== netPay.currency
    ) {
      throw new Error('All monetary amounts must have the same currency');
    }

    this.id = id;
    this.transactionId = transactionId;
    this.jobId = jobId;
    this.employeeId = employeeId;
    this.companyId = companyId;
    this.periodId = periodId;
    this.grossPay = grossPay;
    this.deductions = deductions;
    this.netPay = netPay;
    this.generatedAt = new Date();

    // Freeze to enforce immutability
    Object.freeze(this);
  }
}
