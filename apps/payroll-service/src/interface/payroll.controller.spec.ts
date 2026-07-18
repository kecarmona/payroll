import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import type { Request } from 'express';
import { JwtAuthGuard, RolesGuard } from '@payroll/auth-guards';
import { CreatePayrollPeriodHandler, CreatePayrollPeriodCommand } from '../application/create-payroll-period.command';
import { CreatePayrollJobHandler, CreatePayrollJobCommand } from '../application/create-payroll-job.command';
import { GetPayrollJobHandler, GetPayrollJobQuery } from '../application/queries/get-payroll-job.query';
import { ListPayrollPeriodsHandler, ListPayrollPeriodsQuery } from '../application/queries/list-payroll-periods.query';
import { PayrollPeriodNotFoundError, PayrollJobNotFoundError, DuplicatePayrollPeriodError } from '../application/errors';
import { PayrollController } from './payroll.controller';
import { CreatePayrollPeriodDto } from './dto/create-payroll-period.dto';
import { CreatePayrollJobDto } from './dto/create-payroll-job.dto';
import { PayrollPeriod } from '../domain/payroll-period.entity';
import { PayrollJob } from '../domain/payroll-job.entity';
import { PayrollJobStatus } from '../domain/payroll-job-status';
import type { IdempotencyStore } from '../domain/idempotency-store';
import { IDEMPOTENCY_STORE_TOKEN } from '../infrastructure/payroll.module';
import { PayrollJobResponseDto } from './dto/payroll-job-response.dto';
import { PayrollPeriodResponseDto } from './dto/payroll-period-response.dto';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('PayrollController', () => {
  let controller: PayrollController;
  let mockCreatePeriodHandler: jest.Mocked<CreatePayrollPeriodHandler>;
  let mockCreateJobHandler: jest.Mocked<CreatePayrollJobHandler>;
  let mockGetJobHandler: jest.Mocked<GetPayrollJobHandler>;
  let mockListPeriodsHandler: jest.Mocked<ListPayrollPeriodsHandler>;

  /** Builds a domain PayrollPeriod for test assertions. */
  function buildPeriod(id: string, overrides: Partial<{
    companyId: string;
    month: number;
    year: number;
    startDate: string;
    endDate: string;
    isClosed: boolean;
  }> = {}): PayrollPeriod {
    return PayrollPeriod.reconstitute({
      id,
      companyId: overrides.companyId ?? 'company-1',
      month: overrides.month ?? 3,
      year: overrides.year ?? 2026,
      startDate: overrides.startDate ?? '2026-03-01',
      endDate: overrides.endDate ?? '2026-03-31',
      isClosed: overrides.isClosed ?? false,
      version: 0,
    });
  }

  /** Builds a domain PayrollJob for test assertions. */
  function buildJob(id: string, overrides: Partial<{
    companyId: string;
    periodId: string;
    status: PayrollJobStatus;
  }> = {}): PayrollJob {
    return PayrollJob.reconstitute({
      id,
      companyId: overrides.companyId ?? 'company-1',
      periodId: overrides.periodId ?? 'period-1',
      status: overrides.status ?? PayrollJobStatus.CREATED,
      version: 0,
    });
  }

  beforeEach(async () => {
    mockCreatePeriodHandler = { execute: jest.fn() } as any;
    mockCreateJobHandler = { execute: jest.fn() } as any;
    mockGetJobHandler = { execute: jest.fn() } as any;
    mockListPeriodsHandler = { execute: jest.fn() } as any;

    const mockIdempotencyStore: jest.Mocked<IdempotencyStore> = {
      findByKey: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayrollController],
      imports: [
        JwtModule.register({ secret: 'test-secret' }),
      ],
      providers: [
        JwtAuthGuard,
        RolesGuard,
        { provide: CreatePayrollPeriodHandler, useValue: mockCreatePeriodHandler },
        { provide: CreatePayrollJobHandler, useValue: mockCreateJobHandler },
        { provide: GetPayrollJobHandler, useValue: mockGetJobHandler },
        { provide: ListPayrollPeriodsHandler, useValue: mockListPeriodsHandler },
        { provide: IDEMPOTENCY_STORE_TOKEN, useValue: mockIdempotencyStore },
      ],
    }).compile();

    controller = module.get<PayrollController>(PayrollController);
  });

  // ─── POST /payroll/periods ────────────────────────────────────

  describe('POST /payroll/periods', () => {
    it('should call CreatePayrollPeriodHandler and return the periodId', async () => {
      mockCreatePeriodHandler.execute.mockResolvedValue('new-period-id');

      const dto = new CreatePayrollPeriodDto();
      Object.assign(dto, {
        companyId: 'company-1',
        month: 4,
        year: 2026,
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      });

      const result = await controller.createPeriod(dto);

      expect(result).toEqual({ periodId: 'new-period-id' });
      expect(mockCreatePeriodHandler.execute).toHaveBeenCalledTimes(1);
      expect(mockCreatePeriodHandler.execute).toHaveBeenCalledWith(
        expect.any(CreatePayrollPeriodCommand),
      );

      const command = mockCreatePeriodHandler.execute.mock.calls[0][0] as CreatePayrollPeriodCommand;
      expect(command.companyId).toBe('company-1');
      expect(command.month).toBe(4);
      expect(command.year).toBe(2026);
    });

    it('should propagate DuplicatePayrollPeriodError from the handler', async () => {
      mockCreatePeriodHandler.execute.mockRejectedValue(
        new DuplicatePayrollPeriodError('company-1', 4, 2026),
      );

      const dto = new CreatePayrollPeriodDto();
      Object.assign(dto, {
        companyId: 'company-1',
        month: 4,
        year: 2026,
        startDate: '2026-04-01',
        endDate: '2026-04-30',
      });

      await expect(controller.createPeriod(dto)).rejects.toThrow(
        DuplicatePayrollPeriodError,
      );
    });
  });

  // ─── POST /payroll/jobs ───────────────────────────────────────

  describe('POST /payroll/jobs', () => {
    it('should call CreatePayrollJobHandler and return jobId + status', async () => {
      mockCreateJobHandler.execute.mockResolvedValue({
        jobId: 'new-job-id',
        status: 'CREATED',
      });

      const dto = new CreatePayrollJobDto();
      Object.assign(dto, {
        companyId: 'company-1',
        periodId: 'period-1',
      });

      const mockRequest = { idempotencyInfo: { key: 'test-key', requestHash: 'hash' } } as unknown as Request;
      const result = await controller.createJob(dto, mockRequest);

      expect(result).toEqual({ jobId: 'new-job-id', status: 'CREATED' });
      expect(mockCreateJobHandler.execute).toHaveBeenCalledTimes(1);
      expect(mockCreateJobHandler.execute).toHaveBeenCalledWith(
        expect.any(CreatePayrollJobCommand),
      );

      const command = mockCreateJobHandler.execute.mock.calls[0][0] as CreatePayrollJobCommand;
      expect(command.companyId).toBe('company-1');
      expect(command.periodId).toBe('period-1');
    });

    it('should propagate PayrollPeriodNotFoundError from the handler', async () => {
      mockCreateJobHandler.execute.mockRejectedValue(
        new PayrollPeriodNotFoundError('non-existent'),
      );

      const dto = new CreatePayrollJobDto();
      Object.assign(dto, { companyId: 'company-1', periodId: 'non-existent' });

      const mockRequest = { idempotencyInfo: { key: 'test-key', requestHash: 'hash' } } as unknown as Request;
      await expect(controller.createJob(dto, mockRequest)).rejects.toThrow(
        PayrollPeriodNotFoundError,
      );
    });
  });

  // ─── GET /payroll/jobs/:id ────────────────────────────────────

  describe('GET /payroll/jobs/:id', () => {
    it('should call GetPayrollJobHandler and return PayrollJobResponseDto', async () => {
      const job = buildJob('job-123', {
        companyId: 'company-1',
        periodId: 'period-1',
        status: PayrollJobStatus.PROCESSING,
      });
      mockGetJobHandler.execute.mockResolvedValue(job);

      const result = await controller.getJob('job-123');

      expect(result).toBeInstanceOf(PayrollJobResponseDto);
      expect(result.id).toBe('job-123');
      expect(result.companyId).toBe('company-1');
      expect(result.periodId).toBe('period-1');
      expect(result.status).toBe('PROCESSING');
      expect(mockGetJobHandler.execute).toHaveBeenCalledWith(
        expect.any(GetPayrollJobQuery),
      );

      const query = mockGetJobHandler.execute.mock.calls[0][0] as GetPayrollJobQuery;
      expect(query.jobId).toBe('job-123');
    });

    it('should propagate PayrollJobNotFoundError from the handler', async () => {
      mockGetJobHandler.execute.mockRejectedValue(
        new PayrollJobNotFoundError('non-existent'),
      );

      await expect(controller.getJob('non-existent')).rejects.toThrow(
        PayrollJobNotFoundError,
      );
    });
  });

  // ─── GET /payroll/periods ─────────────────────────────────────

  describe('GET /payroll/periods', () => {
    it('should call ListPayrollPeriodsHandler with companyId and return PayrollPeriodResponseDto[]', async () => {
      const p1 = buildPeriod('pp-1', {
        companyId: 'company-1',
        month: 1,
        year: 2026,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      });
      const p2 = buildPeriod('pp-2', {
        companyId: 'company-1',
        month: 2,
        year: 2026,
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      });
      mockListPeriodsHandler.execute.mockResolvedValue([p1, p2]);

      const result = await controller.listPeriods('company-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(PayrollPeriodResponseDto);
      expect(result[0].id).toBe('pp-1');
      expect(result[0].month).toBe(1);
      expect(result[0].year).toBe(2026);
      expect(result[1].id).toBe('pp-2');
      expect(result[1].month).toBe(2);
      expect(result[1].year).toBe(2026);
      expect(mockListPeriodsHandler.execute).toHaveBeenCalledWith(
        expect.any(ListPayrollPeriodsQuery),
      );

      const query = mockListPeriodsHandler.execute.mock.calls[0][0] as ListPayrollPeriodsQuery;
      expect(query.companyId).toBe('company-1');
    });

    it('should return an empty array when no periods exist', async () => {
      mockListPeriodsHandler.execute.mockResolvedValue([]);

      const result = await controller.listPeriods('empty-company');

      expect(result).toEqual([]);
    });
  });
});
