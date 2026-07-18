import { PayrollJob } from '../../domain/payroll-job.entity';
import type { PayrollJobRepository } from '../../domain/payroll-job.repository';
import { PayrollJobNotFoundError } from '../errors';

/**
 * Query to retrieve a single payroll job by its unique identifier.
 */
export class GetPayrollJobQuery {
  constructor(public readonly jobId: string) {}
}

/**
 * Handler for the GetPayrollJobQuery.
 *
 * Finds the payroll job by ID and returns the full PayrollJob aggregate.
 * Throws PayrollJobNotFoundError if the job does not exist.
 */
export class GetPayrollJobHandler {
  constructor(
    private readonly payrollJobRepository: PayrollJobRepository,
  ) {}

  /**
   * Executes the get-payroll-job query.
   *
   * @param query - The query containing the job ID to look up.
   * @returns The PayrollJob aggregate.
   * @throws {PayrollJobNotFoundError} If the job does not exist.
   */
  async execute(query: GetPayrollJobQuery): Promise<PayrollJob> {
    const job = await this.payrollJobRepository.findById(query.jobId);

    if (!job) {
      throw new PayrollJobNotFoundError(query.jobId);
    }

    return job;
  }
}
