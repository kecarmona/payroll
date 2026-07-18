import { DataSource, Repository } from 'typeorm';
import { TypeOrmPayrollJobRepository } from './typeorm-payroll-job.repository';
import { TypeOrmPayrollJobEntity } from './typeorm-payroll-job.entity';
import { PayrollJob } from '../../domain/payroll-job.entity';
import { PayrollJobStatus } from '../../domain/payroll-job-status';

describe('TypeOrmPayrollJobRepository', () => {
  let repository: TypeOrmPayrollJobRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockTypeOrmRepo: jest.Mocked<Repository<TypeOrmPayrollJobEntity>>;
  let testJob: PayrollJob;

  beforeAll(() => {
    testJob = PayrollJob.create('company-1', 'period-1');
  });

  beforeEach(() => {
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<TypeOrmPayrollJobEntity>>;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    } as unknown as jest.Mocked<DataSource>;

    repository = new TypeOrmPayrollJobRepository(mockDataSource);
  });

  describe('save', () => {
    it('should persist the job entity via TypeORM repository', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmPayrollJobEntity);

      await repository.save(testJob);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
      const savedEntity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmPayrollJobEntity;

      expect(savedEntity.id).toBe(testJob.id);
      expect(savedEntity.companyId).toBe('company-1');
      expect(savedEntity.periodId).toBe('period-1');
      expect(savedEntity.status).toBe('CREATED');
      expect(savedEntity.version).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return null when job is not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });
    });

    it('should reconstitute a PayrollJob from a found entity', async () => {
      const entity: TypeOrmPayrollJobEntity = {
        id: testJob.id,
        companyId: 'company-1',
        periodId: 'period-2',
        status: 'PROCESSING',
        version: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmPayrollJobEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(testJob.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(testJob.id);
      expect(result!.periodId).toBe('period-2');
      expect(result!.status.value).toBe('PROCESSING');
      expect(result!.version).toBe(2);
    });
  });

  describe('findByCompanyAndPeriod', () => {
    it('should return null when no matching job', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByCompanyAndPeriod('company-1', 'period-x');

      expect(result).toBeNull();
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { companyId: 'company-1', periodId: 'period-x' },
      });
    });

    it('should find a job by company and period', async () => {
      const entity: TypeOrmPayrollJobEntity = {
        id: testJob.id,
        companyId: 'company-1',
        periodId: 'period-1',
        status: 'CREATED',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmPayrollJobEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByCompanyAndPeriod('company-1', 'period-1');

      expect(result).not.toBeNull();
      expect(result!.periodId).toBe('period-1');
      expect(result!.status.value).toBe('CREATED');
    });
  });

  describe('entity mapping roundtrip', () => {
    it('should preserve all fields through toEntity → toDomain', async () => {
      const original = PayrollJob.create('roundtrip-co', 'roundtrip-period');

      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmPayrollJobEntity);
      await repository.save(original);

      const savedEntity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmPayrollJobEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(savedEntity);
      const roundtrip = await repository.findById(original.id);

      expect(roundtrip).not.toBeNull();
      expect(roundtrip!.id).toBe(original.id);
      expect(roundtrip!.companyId).toBe('roundtrip-co');
      expect(roundtrip!.periodId).toBe('roundtrip-period');
      expect(roundtrip!.status.value).toBe('CREATED');
      expect(roundtrip!.version).toBe(0);
    });

    it('should handle FAILED status reconstitution', async () => {
      const entity: TypeOrmPayrollJobEntity = {
        id: 'failed-job',
        companyId: 'company-1',
        periodId: 'period-fail',
        status: 'FAILED',
        version: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmPayrollJobEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById('failed-job');

      expect(result).not.toBeNull();
      expect(result!.status).toBe(PayrollJobStatus.FAILED);
      expect(result!.status.value).toBe('FAILED');
    });
  });
});
