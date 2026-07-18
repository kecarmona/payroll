import { Money } from '@payroll/shared-kernel';

/**
 * Result of a payroll calculation for a single employee.
 */
export interface CalculationResult {
  /** The calculated gross pay. */
  readonly grossPay: Money;
  /** The calculated total deductions. */
  readonly deductions: Money;
  /** The calculated net pay (gross minus deductions). */
  readonly netPay: Money;
}

/**
 * Domain service interface for calculating employee payroll amounts.
 *
 * Implementations encapsulate the pay calculation rules (salary, overtime,
 * benefits, taxes, etc.) and return the computed monetary amounts.
 *
 * @remarks
 * This is a **stub** implementation. In production, this would integrate
 * with salary tables, time tracking, benefits administration, and tax
 * calculation engines.
 */
export interface PayrollCalculationService {
  /**
   * Calculates payroll amounts for an employee in a given period.
   *
   * @param employeeId - The employee to calculate payroll for.
   * @param periodId   - The payroll period identifier.
   * @param companyId  - The tenant (company) the employee belongs to.
   * @returns The calculation result with gross pay, deductions, and net pay.
   */
  calculate(
    employeeId: string,
    periodId: string,
    companyId: string,
  ): CalculationResult;
}
