import { AggregateRoot, Money } from '@payroll/shared-kernel';
import { PayrollTransactionId } from './payroll-transaction-id';
import { PayrollTransactionStatus, canTransition } from './payroll-transaction-status';
import { PayrollTransactionCreatedEvent } from './events/payroll-transaction-created.event';
import { PayrollTransactionCompletedEvent } from './events/payroll-transaction-completed.event';
import { PayrollTransactionFailedEvent } from './events/payroll-transaction-failed.event';
import { InvalidTransactionStatusTransitionError } from './errors';

/**
 * Represents a single per-employee payroll transaction.
 *
 * Each transaction tracks the processing of one employee's payroll within
 * a payroll job. The transaction transitions through a state machine:
 * `PENDING → PROCESSING → COMPLETED | FAILED`
 *
 * Financial amounts are stored as Money value objects to ensure currency
 * consistency and avoid floating-point precision issues.
 */
export class PayrollTransaction extends AggregateRoot<string> {
  private readonly _jobId: string;
  private readonly _employeeId: string;
  private readonly _periodId: string;
  private _status: PayrollTransactionStatus;
  private _grossPay: Money | null;
  private _deductions: Money | null;
  private _netPay: Money | null;

  private constructor(
    id: string,
    companyId: string,
    jobId: string,
    employeeId: string,
    periodId: string,
    status: PayrollTransactionStatus,
    grossPay: Money | null,
    deductions: Money | null,
    netPay: Money | null,
    version?: number,
  ) {
    super(id, companyId, version);
    this._jobId = jobId;
    this._employeeId = employeeId;
    this._periodId = periodId;
    this._status = status;
    this._grossPay = grossPay;
    this._deductions = deductions;
    this._netPay = netPay;
  }

  // ─── Getters ─────────────────────────────────────────────────

  /** The parent payroll job identifier. */
  get jobId(): string {
    return this._jobId;
  }

  /** The employee this transaction is for. */
  get employeeId(): string {
    return this._employeeId;
  }

  /** The payroll period identifier this transaction targets. */
  get periodId(): string {
    return this._periodId;
  }

  /** The current lifecycle status of this transaction. */
  get status(): PayrollTransactionStatus {
    return this._status;
  }

  /** Gross pay amount, or `null` if not yet calculated. */
  get grossPay(): Money | null {
    return this._grossPay;
  }

  /** Total deductions amount, or `null` if not yet calculated. */
  get deductions(): Money | null {
    return this._deductions;
  }

  /** Net pay amount (gross minus deductions), or `null` if not yet calculated. */
  get netPay(): Money | null {
    return this._netPay;
  }

  // ─── Factory Methods ─────────────────────────────────────────

  /**
   * Creates a new PayrollTransaction in PENDING status.
   *
   * Records a `PayrollTransactionCreated` domain event.
   *
   * @param companyId  - The tenant (company) this transaction belongs to.
   * @param jobId      - The parent payroll job identifier.
   * @param employeeId - The employee this transaction is for.
   * @param periodId   - The payroll period identifier.
   * @returns A new PayrollTransaction instance with PENDING status.
   */
  static create(
    companyId: string,
    jobId: string,
    employeeId: string,
    periodId: string,
  ): PayrollTransaction {
    const id = PayrollTransactionId.create();
    const tx = new PayrollTransaction(
      id.toString(),
      companyId,
      jobId,
      employeeId,
      periodId,
      PayrollTransactionStatus.PENDING,
      null,
      null,
      null,
      0,
    );

    tx.recordEvent(
      new PayrollTransactionCreatedEvent({
        transactionId: tx.id,
        jobId: tx._jobId,
        employeeId: tx._employeeId,
        companyId: tx.companyId,
        periodId: tx._periodId,
        timestamp: new Date().toISOString(),
      }),
    );

    return tx;
  }

  /**
   * Reconstitutes a PayrollTransaction from persisted data.
   *
   * Bypasses the creation flow and does NOT record events.
   *
   * @param props - All persisted properties of the transaction.
   * @returns A reconstituted PayrollTransaction instance.
   */
  static reconstitute(props: {
    id: string;
    companyId: string;
    jobId: string;
    employeeId: string;
    periodId: string;
    status: PayrollTransactionStatus;
    grossPayCents: number | null;
    deductionsCents: number | null;
    netPayCents: number | null;
    currency: string | null;
    version: number;
  }): PayrollTransaction {
    const grossPay =
      props.grossPayCents !== null && props.currency !== null
        ? Money.fromCents(props.grossPayCents, props.currency)
        : null;
    const deductions =
      props.deductionsCents !== null && props.currency !== null
        ? Money.fromCents(props.deductionsCents, props.currency)
        : null;
    const netPay =
      props.netPayCents !== null && props.currency !== null
        ? Money.fromCents(props.netPayCents, props.currency)
        : null;

    return new PayrollTransaction(
      props.id,
      props.companyId,
      props.jobId,
      props.employeeId,
      props.periodId,
      props.status,
      grossPay,
      deductions,
      netPay,
      props.version,
    );
  }

  // ─── Business Methods ─────────────────────────────────────────

  /**
   * Marks this transaction as being processed.
   *
   * @throws {InvalidTransactionStatusTransitionError} If the current status
   *         does not allow transitioning to PROCESSING.
   */
  startProcessing(): void {
    this.assertValidTransition(PayrollTransactionStatus.PROCESSING);
    this._status = PayrollTransactionStatus.PROCESSING;
  }

  /**
   * Completes this transaction with calculated financial amounts.
   *
   * Validates that all Money instances share the same currency before
   * recording the completion event.
   *
   * @param grossPay   - The gross pay amount.
   * @param deductions - The total deductions amount.
   * @param netPay     - The net pay amount (gross minus deductions).
   * @throws {InvalidTransactionStatusTransitionError} If not in PROCESSING state.
   * @throws {Error} If the amounts have mismatched currencies.
   */
  complete(grossPay: Money, deductions: Money, netPay: Money): void {
    this.assertValidTransition(PayrollTransactionStatus.COMPLETED);

    // Validate all amounts share the same currency
    if (grossPay.currency !== deductions.currency || grossPay.currency !== netPay.currency) {
      throw new Error('All monetary amounts must have the same currency');
    }

    // Validate netPay = grossPay - deductions
    const calculatedNet = grossPay.subtract(deductions);
    if (calculatedNet.amount !== netPay.amount) {
      throw new Error(
        `Net pay mismatch: expected ${calculatedNet.amount}, got ${netPay.amount}`,
      );
    }

    this._grossPay = grossPay;
    this._deductions = deductions;
    this._netPay = netPay;
    this._status = PayrollTransactionStatus.COMPLETED;

    this.recordEvent(
      new PayrollTransactionCompletedEvent({
        transactionId: this.id,
        jobId: this._jobId,
        employeeId: this._employeeId,
        companyId: this.companyId,
        periodId: this._periodId,
        grossPayCents: grossPay.amount,
        deductionsCents: deductions.amount,
        netPayCents: netPay.amount,
        currency: grossPay.currency,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  /**
   * Marks this transaction as failed.
   *
   * @throws {InvalidTransactionStatusTransitionError} If not in PROCESSING state.
   */
  fail(): void {
    this.assertValidTransition(PayrollTransactionStatus.FAILED);
    this._status = PayrollTransactionStatus.FAILED;

    this.recordEvent(
      new PayrollTransactionFailedEvent({
        transactionId: this.id,
        jobId: this._jobId,
        employeeId: this._employeeId,
        companyId: this.companyId,
        periodId: this._periodId,
        reason: 'Calculation failed',
        timestamp: new Date().toISOString(),
      }),
    );
  }

  /**
   * Asserts that the current status allows transitioning to the target status.
   *
   * @param target - The target status to validate against.
   * @throws {InvalidTransactionStatusTransitionError} If the transition is not allowed.
   */
  private assertValidTransition(target: PayrollTransactionStatus): void {
    if (!canTransition(this._status, target)) {
      throw new InvalidTransactionStatusTransitionError(this._status, target);
    }
  }
}
