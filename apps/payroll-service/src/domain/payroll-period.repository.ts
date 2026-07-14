import { PayrollPeriod } from './payroll-period.entity';

/**
 * Port interface for PayrollPeriod repository operations.
 *
 * Defines the contract for persisting and retrieving PayrollPeriod aggregates.
 * The implementation lives in the infrastructure layer (TypeORM).
 */
export interface PayrollPeriodRepository {
  /**
   * Persists a PayrollPeriod aggregate.
   *
   * Creates a new record if the period does not exist, or updates
   * an existing record. The implementation MUST check the version
   * field for optimistic concurrency control.
   *
   * @param period - The PayrollPeriod aggregate to save.
   */
  save(period: PayrollPeriod): Promise<void>;

  /**
   * Finds a PayrollPeriod by its unique identifier.
   *
   * @param id - The PayrollPeriod ID string.
   * @returns The PayrollPeriod aggregate, or `null` if not found.
   */
  findById(id: string): Promise<PayrollPeriod | null>;

  /**
   * Finds a PayrollPeriod by company, month, and year.
   *
   * @param companyId - The tenant / company identifier.
   * @param month     - The month (1-12).
   * @param year      - The year.
   * @returns The PayrollPeriod aggregate, or `null` if not found.
   */
  findByCompanyAndPeriod(
    companyId: string,
    month: number,
    year: number,
  ): Promise<PayrollPeriod | null>;

  /**
   * Finds all PayrollPeriods belonging to a company.
   *
   * @param companyId - The tenant / company identifier.
   * @returns An array of PayrollPeriod aggregates for the company.
   */
  findByCompanyId(companyId: string): Promise<PayrollPeriod[]>;
}
