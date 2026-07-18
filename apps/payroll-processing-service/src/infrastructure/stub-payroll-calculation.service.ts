import { Money } from '@payroll/shared-kernel';
import type {
  PayrollCalculationService,
  CalculationResult,
} from '../domain/payroll-calculation.service';

/**
 * Stub implementation of the {@link PayrollCalculationService}.
 *
 * Returns fixed amounts for every employee: grossPay = $5,000.00,
 * deductions = $1,000.00, netPay = $4,000.00.
 *
 * In production, this would integrate with salary tables, time tracking,
 * benefits administration, and tax calculation engines.
 */
export class StubPayrollCalculationService
  implements PayrollCalculationService
{
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calculate(employeeId: string, periodId: string, companyId: string): CalculationResult {
    const grossPay = Money.fromCents(500000, 'USD');
    const deductions = Money.fromCents(100000, 'USD');
    const netPay = Money.fromCents(400000, 'USD');

    return { grossPay, deductions, netPay };
  }
}
