import { DomainError } from '@payroll/shared-kernel';

/**
 * Error raised when a payroll job is not found by the given identifier.
 */
export class PayrollJobNotFoundError extends DomainError {
  /** The identifier that was searched for. */
  readonly jobId: string;

  constructor(jobId: string) {
    super('payroll-processing', `Payroll job with id "${jobId}" not found`);
    this.jobId = jobId;
  }
}
