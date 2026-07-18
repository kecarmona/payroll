import { DataSource, Repository } from 'typeorm';
import { TypeOrmPayrollPeriodRepository } from './typeorm-payroll-period.repository';
import { TypeOrmPayrollPeriodEntity } from './typeorm-payroll-period.entity';
import { PayrollPeriod } from '../../domain/payroll-period.entity';

describe('TypeOrmPayrollPeriodRepository', () => {
  let repository: TypeOrmPayrollPeriodRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockTypeOrmRepo: jest.Mocked<Repository<TypeOrmPayrollPeriodEntity>>;
  let testPeriod: PayrollPeriod;

  beforeAll(() => {
    testPeriod = PayrollPeriod.create('company-1', 1, 2026, '2026-01-01', '2026-01-31');
  });

  beforeEach(() => {
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<TypeOrmPayrollPeriodEntity>>;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    } as unknown as jest.Mocked<DataSource>;

    repository = new TypeOrmPayrollPeriodRepository(mockDataSource);
  });

  describe('save', () => {
    it('should persist the period entity via TypeORM repository', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmPayrollPeriodEntity);

      await repository.save(testPeriod);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
      const savedEntity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmPayrollPeriodEntity;

      expect(savedEntity.id).toBe(testPeriod.id);
      expect(savedEntity.companyId).toBe('company-1');
      expect(savedEntity.month).toBe(1);
      expect(savedEntity.year).toBe(2026);
      expect(savedEntity.startDate).toBe('2026-01-01');
      expect(savedEntity.endDate).toBe('2026-01-31');
      expect(savedEntity.isClosed).toBe(false);
      expect(savedEntity.version).toBe(0);
    });
  });

  describe('findById', () => {
    it('should return null when period is not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });
    });

    it('should reconstitute a PayrollPeriod from a found entity', async () => {
      const entity: TypeOrmPayrollPeriodEntity = {
        id: testPeriod.id,
        companyId: 'company-1',
        month: 2,
        year: 2026,
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        isClosed: true,
        version: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmPayrollPeriodEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(testPeriod.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(testPeriod.id);
      expect(result!.month).toBe(2);
      expect(result!.year).toBe(2026);
      expect(result!.startDate).toBe('2026-02-01');
      expect(result!.endDate).toBe('2026-02-28');
      expect(result!.isClosed).toBe(true);
      expect(result!.version).toBe(3);
    });
  });

  describe('findByCompanyAndPeriod', () => {
    it('should return null when no matching period', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByCompanyAndPeriod('company-1', 6, 2026);

      expect(result).toBeNull();
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { companyId: 'company-1', month: 6, year: 2026 },
      });
    });

    it('should find a period by company, month, and year', async () => {
      const entity: TypeOrmPayrollPeriodEntity = {
        id: testPeriod.id,
        companyId: 'company-1',
        month: 3,
        year: 2026,
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        isClosed: false,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmPayrollPeriodEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByCompanyAndPeriod('company-1', 3, 2026);

      expect(result).not.toBeNull();
      expect(result!.month).toBe(3);
      expect(result!.year).toBe(2026);
    });
  });

  describe('findByCompanyId', () => {
    it('should return an empty array when no periods for the company', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([]);

      const result = await repository.findByCompanyId('empty-company');

      expect(result).toEqual([]);
      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: { companyId: 'empty-company' },
      });
    });

    it('should return all periods for a given company', async () => {
      const entity1: TypeOrmPayrollPeriodEntity = {
        id: 'pp-1',
        companyId: 'company-1',
        month: 1,
        year: 2026,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        isClosed: false,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmPayrollPeriodEntity;

      const entity2: TypeOrmPayrollPeriodEntity = {
        id: 'pp-2',
        companyId: 'company-1',
        month: 2,
        year: 2026,
        startDate: '2026-02-01',
        endDate: '2026-02-28',
        isClosed: false,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TypeOrmPayrollPeriodEntity;

      mockTypeOrmRepo.find.mockResolvedValue([entity1, entity2]);

      const result = await repository.findByCompanyId('company-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('pp-1');
      expect(result[0].month).toBe(1);
      expect(result[1].id).toBe('pp-2');
      expect(result[1].month).toBe(2);
    });
  });

  describe('entity mapping roundtrip', () => {
    it('should preserve all fields through toEntity → toDomain', async () => {
      const original = PayrollPeriod.create('roundtrip-co', 4, 2026, '2026-04-01', '2026-04-30');

      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmPayrollPeriodEntity);
      await repository.save(original);

      const savedEntity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmPayrollPeriodEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(savedEntity);
      const roundtrip = await repository.findById(original.id);

      expect(roundtrip).not.toBeNull();
      expect(roundtrip!.id).toBe(original.id);
      expect(roundtrip!.companyId).toBe(original.companyId);
      expect(roundtrip!.month).toBe(4);
      expect(roundtrip!.year).toBe(2026);
      expect(roundtrip!.startDate).toBe('2026-04-01');
      expect(roundtrip!.endDate).toBe('2026-04-30');
      expect(roundtrip!.isClosed).toBe(false);
      expect(roundtrip!.version).toBe(0);
    });
  });
});
