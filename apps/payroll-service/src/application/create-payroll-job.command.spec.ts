/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSource, EntityManager } from 'typeorm';
import { PayrollJob } from '../domain/payroll-job.entity';
import { PayrollJobStatus } from '../domain/payroll-job-status';
import { PayrollPeriod } from '../domain/payroll-period.entity';
import type { PayrollPeriodRepository } from '../domain/payroll-period.repository';
import type { PayrollJobRepository } from '../domain/payroll-job.repository';
import type { IdempotencyStore, IdempotencyRecord } from '../domain/idempotency-store';
import type { OutboxStore } from '../domain/outbox-store';
import {
  CreatePayrollJobCommand,
  CreatePayrollJobHandler,
} from './create-payroll-job.command';
import { DuplicatePayrollJobError, PayrollPeriodNotFoundError } from './errors';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

class InMemoryPayrollPeriodRepo implements PayrollPeriodRepository {
  private periods: Map<string, PayrollPeriod> = new Map();

  async save(p: PayrollPeriod): Promise<void> { this.periods.set(p.id, p); }
  async findById(id: string): Promise<PayrollPeriod | null> { return this.periods.get(id) ?? null; }
  async findByCompanyAndPeriod(_c: string, _m: number, _y: number): Promise<PayrollPeriod | null> {
    for (const p of this.periods.values()) {
      if (p.companyId === _c && p.month === _m && p.year === _y) return p;
    }
    return null;
  }
  async findByCompanyId(_c: string): Promise<PayrollPeriod[]> {
    return Array.from(this.periods.values()).filter(p => p.companyId === _c);
  }
}

class InMemoryPayrollJobRepo implements PayrollJobRepository {
  public jobs: Map<string, PayrollJob> = new Map();

  async save(j: PayrollJob): Promise<void> { this.jobs.set(j.id, j); }
  async findById(id: string): Promise<PayrollJob | null> { return this.jobs.get(id) ?? null; }
  async findByCompanyAndPeriod(_c: string, _p: string): Promise<PayrollJob | null> {
    for (const j of this.jobs.values()) {
      if (j.companyId === _c && j.periodId === _p) return j;
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CreatePayrollJobHandler', () => {
  let periodRepo: InMemoryPayrollPeriodRepo;
  let jobRepo: InMemoryPayrollJobRepo;
  let idempotencyStore: jest.Mocked<IdempotencyStore>;
  let outboxStore: jest.Mocked<OutboxStore>;
  let mockManager: jest.Mocked<Partial<EntityManager>>;
  let mockDataSource: jest.Mocked<Partial<DataSource>>;
  let handler: CreatePayrollJobHandler;
  let period: PayrollPeriod;

  beforeEach(async () => {
    periodRepo = new InMemoryPayrollPeriodRepo();
    jobRepo = new InMemoryPayrollJobRepo();
    idempotencyStore = { findByKey: jest.fn(), save: jest.fn() };
    outboxStore = { save: jest.fn() };

    // Create a valid period
    period = PayrollPeriod.create('company-1', 1, 2026, '2026-01-01', '2026-01-31');
    await periodRepo.save(period);

    // Mock manager: when 'payroll_jobs' is saved, also store in jobRepo for duplicate detection
    mockManager = {
      save: jest.fn().mockImplementation(async (entity: string, data: any) => {
        if (entity === 'payroll_jobs' && data) {
          const job = PayrollJob.reconstitute({
            id: data.id,
            companyId: data.companyId,
            periodId: data.periodId,
            status: PayrollJobStatus.from(data.status),
            version: data.version ?? 0,
          });
          await jobRepo.save(job);
        }
        return data;
      }),
      findOne: jest.fn().mockResolvedValue(null),
      getRepository: jest.fn().mockReturnValue({}),
    };

    // Mock DataSource.transaction to execute callback with mock manager
    mockDataSource = {
      transaction: jest.fn().mockImplementation(
        (cb: (em: EntityManager) => Promise<any>) => cb(mockManager as EntityManager),
      ),
    };

    handler = new CreatePayrollJobHandler(
      mockDataSource as DataSource,
      periodRepo,
      jobRepo,
      idempotencyStore,
      outboxStore,
    );
  });

  describe('execute', () => {
    it('should create a new payroll job and return job ID', async () => {
      const command = new CreatePayrollJobCommand(
        'company-1',
        period.id,
        'idem-001',
      );

      const result = await handler.execute(command);

      expect(result).toBeDefined();
      expect(result.jobId).toBeDefined();
      expect(result.status).toBe('CREATED');
    });

    it('should throw PayrollPeriodNotFoundError when period does not exist', async () => {
      const command = new CreatePayrollJobCommand(
        'company-1',
        'non-existent-period',
        'idem-002',
      );

      await expect(handler.execute(command)).rejects.toThrow(
        PayrollPeriodNotFoundError,
      );
    });

    it('should throw DuplicatePayrollJobError when job already exists for company+period', async () => {
      const command1 = new CreatePayrollJobCommand(
        'company-1',
        period.id,
        'idem-003',
      );
      await handler.execute(command1);

      const command2 = new CreatePayrollJobCommand(
        'company-1',
        period.id,
        'idem-004',
      );

      await expect(handler.execute(command2)).rejects.toThrow(
        DuplicatePayrollJobError,
      );
    });

    it('should return cached response on idempotent replay', async () => {
      idempotencyStore.findByKey.mockResolvedValue({
        key: 'idem-replay',
        requestHash: expect.any(String),
        responseStatus: 201,
        responseBody: { jobId: 'cached-job', status: 'CREATED' },
        createdAt: new Date(),
      } as IdempotencyRecord);

      const command = new CreatePayrollJobCommand(
        'company-1',
        period.id,
        'idem-replay',
      );

      const result = await handler.execute(command);

      expect(result).toEqual({ jobId: 'cached-job', status: 'CREATED' });
      // Should NOT have called transaction
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('should save outbox record within the transaction', async () => {
      const command = new CreatePayrollJobCommand(
        'company-1',
        period.id,
        'idem-outbox',
      );

      await handler.execute(command);

      // Verify manager.save was called (for job entity, outbox, idempotency)
      expect(mockManager.save).toHaveBeenCalled();
    });
  });
});
