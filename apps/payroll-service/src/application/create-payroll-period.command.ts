import { PayrollPeriod } from '../domain/payroll-period.entity';
import type { PayrollPeriodRepository } from '../domain/payroll-period.repository';
import { DuplicatePayrollPeriodError } from './errors';

/**
 * Command to create a new payroll period for a company.
 */
export class CreatePayrollPeriodCommand {
  constructor(
    public readonly companyId: string,
    public readonly month: number,
    public readonly year: number,
    public readonly startDate: string,
    public readonly endDate: string,
  ) {}
}

/**
 * Handler for the CreatePayrollPeriodCommand.
 *
 * Validates that no duplicate period exists for the same (companyId, month, year),
 * creates the PayrollPeriod aggregate (which records a PayrollPeriodCreated
 * domain event), and persists it.
 */
export class CreatePayrollPeriodHandler {
  constructor(
    private readonly payrollPeriodRepository: PayrollPeriodRepository,
  ) {}

  /**
   * Executes the create-payroll-period command.
   *
   * @param command - The payroll period creation details.
   * @returns The newly created period ID as a string.
   * @throws {DuplicatePayrollPeriodError} If a period exists for the same company, month, and year.
   */
  async execute(command: CreatePayrollPeriodCommand): Promise<string> {
    const existing = await this.payrollPeriodRepository.findByCompanyAndPeriod(
      command.companyId,
      command.month,
      command.year,
    );

    if (existing) {
      throw new DuplicatePayrollPeriodError(
        command.companyId,
        command.month,
        command.year,
      );
    }

    const period = PayrollPeriod.create(
      command.companyId,
      command.month,
      command.year,
      command.startDate,
      command.endDate,
    );

    await this.payrollPeriodRepository.save(period);

    return period.id;
  }
}
