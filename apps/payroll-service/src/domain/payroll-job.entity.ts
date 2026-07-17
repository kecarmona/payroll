import { AggregateRoot } from '@payroll/shared-kernel';
import { PayrollJobId } from './payroll-job-id';
import { PayrollJobStatus } from './payroll-job-status';
import { PayrollJobCreatedEvent } from './events/payroll-job-created.event';
import { InvalidStatusTransitionError } from './errors';

/**
 * Represents a payroll job — a unit of payroll processing work.
 *
 * Each job belongs to a company and targets a specific payroll period.
 * The job transitions through a state machine:
 * `CREATED → PROCESSING → COMPLETED | FAILED`
 *
 * @example
 * ```ts
 * const job = PayrollJob.create('company-1', 'period-123');
 * job.transitionTo(PayrollJobStatus.PROCESSING);
 * ```
 */
export class PayrollJob extends AggregateRoot<string> {
  private readonly _periodId: string;
  private _status: PayrollJobStatus;

  private constructor(
    id: string,
    companyId: string,
    periodId: string,
    status: PayrollJobStatus,
    version?: number,
  ) {
    super(id, companyId, version);
    this._periodId = periodId;
    this._status = status;
  }

  // ─── Getters ─────────────────────────────────────────────────

  /** The payroll period identifier this job targets. */
  get periodId(): string {
    return this._periodId;
  }

  /** The current lifecycle status of this job. */
  get status(): PayrollJobStatus {
    return this._status;
  }

  // ─── Factory Methods ─────────────────────────────────────────

  /**
   * Creates a new PayrollJob in CREATED status.
   *
   * Records a `PayrollJobCreated` domain event.
   *
   * @param companyId - The tenant (company) this job belongs to.
   * @param periodId  - The payroll period this job targets.
   * @returns A new PayrollJob instance with CREATED status and a recorded event.
   */
  static create(companyId: string, periodId: string, employeeIds: string[] = []): PayrollJob {
    const id = PayrollJobId.create();
    const job = new PayrollJob(
      id.toString(),
      companyId,
      periodId,
      PayrollJobStatus.CREATED,
      0,
    );

    job.recordEvent(
      new PayrollJobCreatedEvent({
        jobId: job.id,
        companyId: job.companyId,
        periodId: job._periodId,
        employeeIds,
        timestamp: new Date().toISOString(),
      }),
    );

    return job;
  }

  /**
   * Reconstitutes a PayrollJob from persisted data.
   *
   * Bypasses the creation flow and does NOT record events.
   *
   * @param props - All persisted properties of the payroll job.
   * @returns A reconstituted PayrollJob instance.
   */
  static reconstitute(props: {
    id: string;
    companyId: string;
    periodId: string;
    status: PayrollJobStatus;
    version: number;
  }): PayrollJob {
    return new PayrollJob(
      props.id,
      props.companyId,
      props.periodId,
      props.status,
      props.version,
    );
  }

  // ─── Business Methods ─────────────────────────────────────────

  /**
   * Transitions this job to a new status.
   *
   * Validates the transition using the PayrollJobStatus state machine.
   *
   * @param newStatus - The target status to transition to.
   * @throws {DomainError} If the status transition is not allowed.
   */
  transitionTo(newStatus: PayrollJobStatus): void {
    if (!this._status.canTransitionTo(newStatus)) {
      throw new InvalidStatusTransitionError(
        this._status.value,
        newStatus.value,
      );
    }

    this._status = newStatus;
  }
}
