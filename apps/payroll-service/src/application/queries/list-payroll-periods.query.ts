import { PayrollPeriod } from '../../domain/payroll-period.entity';
import type { PayrollPeriodRepository } from '../../domain/payroll-period.repository';

/**
 * Query to list all payroll periods for a specific company.
 */
export class ListPayrollPeriodsQuery {
  constructor(public readonly companyId: string) {}
}

/**
 * Handler for the ListPayrollPeriodsQuery.
 *
 * Retrieves all payroll periods ordered by year and month for the
 * given company ID.
 */
export class ListPayrollPeriodsHandler {
  constructor(
    private readonly payrollPeriodRepository: PayrollPeriodRepository,
  ) {}

  /**
   * Executes the list-payroll-periods query.
   *
   * @param query - The query containing the company ID to filter by.
   * @returns An array of PayrollPeriod aggregates for the company.
   */
  async execute(query: ListPayrollPeriodsQuery): Promise<PayrollPeriod[]> {
    return this.payrollPeriodRepository.findByCompanyId(query.companyId);
  }
}
