import { DomainError } from '@payroll/shared-kernel';

/**
 * Error raised when a payroll period is not found by the given identifier.
 */
export class PayrollPeriodNotFoundError extends DomainError {
  /** The identifier that was searched for. */
  readonly periodId: string;

  constructor(periodId: string) {
    super('payroll', `Payroll period with id "${periodId}" not found`);
    this.periodId = periodId;
  }
}

/**
 * Error raised when a payroll job is not found by the given identifier.
 */
export class PayrollJobNotFoundError extends DomainError {
  /** The identifier that was searched for. */
  readonly jobId: string;

  constructor(jobId: string) {
    super('payroll', `Payroll job with id "${jobId}" not found`);
    this.jobId = jobId;
  }
}

/**
 * Error raised when a duplicate payroll job is detected.
 *
 * Only one job per (companyId, periodId) combination is allowed.
 */
export class DuplicatePayrollJobError extends DomainError {
  /** The company identifier. */
  readonly companyId: string;
  /** The period identifier. */
  readonly periodId: string;

  constructor(companyId: string, periodId: string) {
    super(
      'payroll',
      `A payroll job already exists for company "${companyId}" and period "${periodId}"`,
    );
    this.companyId = companyId;
    this.periodId = periodId;
  }
}

/**
 * Error raised when a duplicate payroll period is detected.
 *
 * Only one period per (companyId, month, year) combination is allowed.
 */
export class DuplicatePayrollPeriodError extends DomainError {
  /** The company identifier. */
  readonly companyId: string;
  /** The month. */
  readonly month: number;
  /** The year. */
  readonly year: number;

  constructor(companyId: string, month: number, year: number) {
    super(
      'payroll',
      `A payroll period already exists for company "${companyId}" for ${month}/${year}`,
    );
    this.companyId = companyId;
    this.month = month;
    this.year = year;
  }
}
