import { PayrollPeriod } from '../domain/payroll-period.entity';
import type { PayrollPeriodRepository } from '../domain/payroll-period.repository';
import {
  CreatePayrollPeriodCommand,
  CreatePayrollPeriodHandler,
} from './create-payroll-period.command';
import { DuplicatePayrollPeriodError } from './errors';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

class InMemoryPayrollPeriodRepository implements PayrollPeriodRepository {
  private periods: Map<string, PayrollPeriod> = new Map();

  async save(period: PayrollPeriod): Promise<void> {
    this.periods.set(period.id, period);
  }

  async findById(id: string): Promise<PayrollPeriod | null> {
    return this.periods.get(id) ?? null;
  }

  async findByCompanyAndPeriod(
    companyId: string,
    month: number,
    year: number,
  ): Promise<PayrollPeriod | null> {
    for (const period of this.periods.values()) {
      if (
        period.companyId === companyId &&
        period.month === month &&
        period.year === year
      ) {
        return period;
      }
    }
    return null;
  }

  async findByCompanyId(companyId: string): Promise<PayrollPeriod[]> {
    return Array.from(this.periods.values()).filter(
      (p) => p.companyId === companyId,
    );
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CreatePayrollPeriodHandler', () => {
  let repository: InMemoryPayrollPeriodRepository;
  let handler: CreatePayrollPeriodHandler;

  beforeEach(() => {
    repository = new InMemoryPayrollPeriodRepository();
    handler = new CreatePayrollPeriodHandler(repository);
  });

  describe('execute', () => {
    it('should create a new payroll period and return the period ID', async () => {
      const command = new CreatePayrollPeriodCommand(
        'company-1',
        1,
        2026,
        '2026-01-01',
        '2026-01-31',
      );

      const periodId = await handler.execute(command);

      expect(periodId).toBeDefined();
      expect(periodId.length).toBeGreaterThan(0);

      const saved = await repository.findById(periodId);
      expect(saved).not.toBeNull();
      expect(saved!.companyId).toBe('company-1');
      expect(saved!.month).toBe(1);
      expect(saved!.year).toBe(2026);
      expect(saved!.startDate).toBe('2026-01-01');
      expect(saved!.endDate).toBe('2026-01-31');
      expect(saved!.isClosed).toBe(false);
    });

    it('should throw DuplicatePayrollPeriodError when period already exists for company/month/year', async () => {
      const command1 = new CreatePayrollPeriodCommand(
        'company-1',
        1,
        2026,
        '2026-01-01',
        '2026-01-31',
      );
      await handler.execute(command1);

      const command2 = new CreatePayrollPeriodCommand(
        'company-1',
        1,
        2026,
        '2026-01-01',
        '2026-01-31',
      );

      await expect(handler.execute(command2)).rejects.toThrow(
        DuplicatePayrollPeriodError,
      );
    });

    it('should allow same month/year for different companies', async () => {
      const command1 = new CreatePayrollPeriodCommand(
        'company-1',
        1,
        2026,
        '2026-01-01',
        '2026-01-31',
      );
      const id1 = await handler.execute(command1);

      const command2 = new CreatePayrollPeriodCommand(
        'company-2',
        1,
        2026,
        '2026-01-01',
        '2026-01-31',
      );
      const id2 = await handler.execute(command2);

      expect(id1).not.toBe(id2);
    });
  });
});
