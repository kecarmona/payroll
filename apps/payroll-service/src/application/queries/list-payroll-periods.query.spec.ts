import { PayrollPeriod } from '../../domain/payroll-period.entity';
import type { PayrollPeriodRepository } from '../../domain/payroll-period.repository';
import {
  ListPayrollPeriodsQuery,
  ListPayrollPeriodsHandler,
} from './list-payroll-periods.query';

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
    _month: number,
    _year: number,
  ): Promise<PayrollPeriod | null> {
    for (const p of this.periods.values()) {
      if (p.companyId === companyId && p.month === _month && p.year === _year) {
        return p;
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

describe('ListPayrollPeriodsHandler', () => {
  let repository: InMemoryPayrollPeriodRepository;
  let handler: ListPayrollPeriodsHandler;

  beforeEach(() => {
    repository = new InMemoryPayrollPeriodRepository();
    handler = new ListPayrollPeriodsHandler(repository);
  });

  describe('execute', () => {
    it('should return all periods for a company', async () => {
      await repository.save(
        PayrollPeriod.create('company-1', 1, 2026, '2026-01-01', '2026-01-31'),
      );
      await repository.save(
        PayrollPeriod.create('company-1', 2, 2026, '2026-02-01', '2026-02-28'),
      );

      const query = new ListPayrollPeriodsQuery('company-1');
      const results = await handler.execute(query);

      expect(results).toHaveLength(2);
      expect(results[0].companyId).toBe('company-1');
      expect(results[1].companyId).toBe('company-1');
    });

    it('should return an empty array when no periods exist for the company', async () => {
      const query = new ListPayrollPeriodsQuery('empty-company');
      const results = await handler.execute(query);

      expect(results).toEqual([]);
    });

    it('should not return periods from other companies', async () => {
      await repository.save(
        PayrollPeriod.create('company-1', 1, 2026, '2026-01-01', '2026-01-31'),
      );
      await repository.save(
        PayrollPeriod.create('company-2', 2, 2026, '2026-02-01', '2026-02-28'),
      );

      const query = new ListPayrollPeriodsQuery('company-1');
      const results = await handler.execute(query);

      expect(results).toHaveLength(1);
      expect(results[0].month).toBe(1);
    });
  });
});
