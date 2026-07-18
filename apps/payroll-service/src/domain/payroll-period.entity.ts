import { AggregateRoot } from '@payroll/shared-kernel';
import { PayrollPeriodId } from './payroll-period-id';
import { PayrollPeriodCreatedEvent } from './events/payroll-period-created.event';

/**
 * Represents a payroll period — a time window for which payroll is calculated.
 *
 * Each period belongs to a company and has a specific month/year combination.
 * Periods can be closed to prevent further modifications.
 *
 * @example
 * ```ts
 * // Create a new January 2026 period
 * const period = PayrollPeriod.create(
 *   'company-1',
 *   1,
 *   2026,
 *   '2026-01-01',
 *   '2026-01-31',
 * );
 * ```
 */
export class PayrollPeriod extends AggregateRoot<string> {
  private readonly _month: number;
  private readonly _year: number;
  private readonly _startDate: string;
  private readonly _endDate: string;
  private _isClosed: boolean;

  private constructor(
    id: string,
    companyId: string,
    month: number,
    year: number,
    startDate: string,
    endDate: string,
    isClosed: boolean,
    version?: number,
  ) {
    super(id, companyId, version);
    this._month = month;
    this._year = year;
    this._startDate = startDate;
    this._endDate = endDate;
    this._isClosed = isClosed;
  }

  // ─── Getters ─────────────────────────────────────────────────

  /** The month (1-12) this payroll period covers. */
  get month(): number {
    return this._month;
  }

  /** The year this payroll period covers. */
  get year(): number {
    return this._year;
  }

  /** The start date of the payroll period (ISO string). */
  get startDate(): string {
    return this._startDate;
  }

  /** The end date of the payroll period (ISO string). */
  get endDate(): string {
    return this._endDate;
  }

  /** Whether the period is closed for modifications. */
  get isClosed(): boolean {
    return this._isClosed;
  }

  // ─── Factory Methods ───────────────────────────────────────────

  /**
   * Creates a new PayrollPeriod aggregate.
   *
   * Records a `PayrollPeriodCreated` domain event.
   *
   * @param companyId - The tenant (company) this period belongs to.
   * @param month     - The month (1-12) this period covers.
   * @param year      - The year this period covers.
   * @param startDate - The period start date (ISO string).
   * @param endDate   - The period end date (ISO string).
   * @returns A new PayrollPeriod instance with a recorded creation event.
   */
  static create(
    companyId: string,
    month: number,
    year: number,
    startDate: string,
    endDate: string,
  ): PayrollPeriod {
    const id = PayrollPeriodId.create();
    const period = new PayrollPeriod(
      id.toString(),
      companyId,
      month,
      year,
      startDate,
      endDate,
      false,
      0,
    );

    period.recordEvent(
      new PayrollPeriodCreatedEvent({
        periodId: period.id,
        companyId: period.companyId,
        month,
        year,
        startDate,
        endDate,
      }),
    );

    return period;
  }

  /**
   * Reconstitutes a PayrollPeriod from persisted data.
   *
   * Bypasses the creation flow and does NOT record events.
   *
   * @param props - All persisted properties of the payroll period.
   * @returns A reconstituted PayrollPeriod instance.
   */
  static reconstitute(props: {
    id: string;
    companyId: string;
    month: number;
    year: number;
    startDate: string;
    endDate: string;
    isClosed: boolean;
    version: number;
  }): PayrollPeriod {
    return new PayrollPeriod(
      props.id,
      props.companyId,
      props.month,
      props.year,
      props.startDate,
      props.endDate,
      props.isClosed,
      props.version,
    );
  }

  // ─── Business Methods ─────────────────────────────────────────

  /**
   * Closes this payroll period.
   *
   * Idempotent — closing an already-closed period is a no-op.
   */
  close(): void {
    if (this._isClosed) {
      return; // idempotent
    }

    this._isClosed = true;
  }
}
