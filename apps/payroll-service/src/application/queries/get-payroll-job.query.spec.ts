import { PayrollJob } from '../../domain/payroll-job.entity';
import type { PayrollJobRepository } from '../../domain/payroll-job.repository';
import { GetPayrollJobQuery, GetPayrollJobHandler } from './get-payroll-job.query';
import { PayrollJobNotFoundError } from '../errors';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

class InMemoryPayrollJobRepository implements PayrollJobRepository {
  private jobs: Map<string, PayrollJob> = new Map();

  async save(job: PayrollJob): Promise<void> {
    this.jobs.set(job.id, job);
  }

  async findById(id: string): Promise<PayrollJob | null> {
    return this.jobs.get(id) ?? null;
  }

  async findByCompanyAndPeriod(
    companyId: string,
    periodId: string,
  ): Promise<PayrollJob | null> {
    for (const job of this.jobs.values()) {
      if (job.companyId === companyId && job.periodId === periodId) {
        return job;
      }
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GetPayrollJobHandler', () => {
  let repository: InMemoryPayrollJobRepository;
  let handler: GetPayrollJobHandler;

  beforeEach(() => {
    repository = new InMemoryPayrollJobRepository();
    handler = new GetPayrollJobHandler(repository);
  });

  describe('execute', () => {
    it('should return the payroll job for a valid ID', async () => {
      const job = PayrollJob.create('company-1', 'period-1');
      await repository.save(job);

      const query = new GetPayrollJobQuery(job.id);
      const result = await handler.execute(query);

      expect(result).not.toBeNull();
      expect(result.id).toBe(job.id);
      expect(result.companyId).toBe('company-1');
      expect(result.periodId).toBe('period-1');
      expect(result.status.value).toBe('CREATED');
    });

    it('should throw PayrollJobNotFoundError when job does not exist', async () => {
      const query = new GetPayrollJobQuery('non-existent');

      await expect(handler.execute(query)).rejects.toThrow(
        PayrollJobNotFoundError,
      );
    });
  });
});
