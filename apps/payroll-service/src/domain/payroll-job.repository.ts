import { PayrollJob } from './payroll-job.entity';

/**
 * Port interface for PayrollJob repository operations.
 *
 * Defines the contract for persisting and retrieving PayrollJob aggregates.
 * The implementation lives in the infrastructure layer (TypeORM).
 */
export interface PayrollJobRepository {
  /**
   * Persists a PayrollJob aggregate.
   *
   * Creates a new record if the job does not exist, or updates
   * an existing record. The implementation MUST check the version
   * field for optimistic concurrency control.
   *
   * @param job - The PayrollJob aggregate to save.
   */
  save(job: PayrollJob): Promise<void>;

  /**
   * Finds a PayrollJob by its unique identifier.
   *
   * @param id - The PayrollJob ID string.
   * @returns The PayrollJob aggregate, or `null` if not found.
   */
  findById(id: string): Promise<PayrollJob | null>;

  /**
   * Finds a PayrollJob by company and period.
   *
   * @param companyId - The tenant / company identifier.
   * @param periodId  - The PayrollPeriod ID string.
   * @returns The PayrollJob aggregate, or `null` if not found.
   */
  findByCompanyAndPeriod(
    companyId: string,
    periodId: string,
  ): Promise<PayrollJob | null>;
}
