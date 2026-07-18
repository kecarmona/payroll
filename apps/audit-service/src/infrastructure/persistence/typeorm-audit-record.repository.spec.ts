import { DataSource, Repository } from 'typeorm';
import { TypeOrmAuditRecordRepository } from './typeorm-audit-record.repository';
import { TypeOrmAuditRecordEntity } from './typeorm-audit-record.entity';
import { AuditRecord } from '../../domain/audit-record.entity';

describe('TypeOrmAuditRecordRepository', () => {
  let repository: TypeOrmAuditRecordRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockTypeOrmRepo: jest.Mocked<Repository<TypeOrmAuditRecordEntity>>;

  const testRecord = AuditRecord.create({
    id: 'audit-001',
    eventId: 'evt-abc',
    eventType: 'PayrollJobCreated',
    companyId: 'comp-1',
    correlationId: 'corr-xyz',
    payloadSummary: { jobId: 'job-001' },
    occurredAt: new Date('2026-07-01T10:00:00Z'),
    recordedAt: new Date('2026-07-01T10:00:01Z'),
  });

  beforeEach(() => {
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<Repository<TypeOrmAuditRecordEntity>>;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    } as unknown as jest.Mocked<DataSource>;

    repository = new TypeOrmAuditRecordRepository(mockDataSource);
  });

  describe('save', () => {
    it('should persist the audit record as a TypeORM entity', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmAuditRecordEntity);

      await repository.save(testRecord);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
      const entity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmAuditRecordEntity;

      expect(entity.id).toBe('audit-001');
      expect(entity.eventId).toBe('evt-abc');
      expect(entity.eventType).toBe('PayrollJobCreated');
      expect(entity.companyId).toBe('comp-1');
      expect(entity.correlationId).toBe('corr-xyz');
      expect(entity.payloadSummary).toEqual({ jobId: 'job-001' });
      expect(entity.occurredAt).toEqual(new Date('2026-07-01T10:00:00Z'));
      expect(entity.recordedAt).toEqual(new Date('2026-07-01T10:00:01Z'));
    });
  });

  describe('existsByEventId', () => {
    it('should return true when a record with the eventId exists', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue({ id: 'audit-001' } as TypeOrmAuditRecordEntity);

      const result = await repository.existsByEventId('evt-abc');

      expect(result).toBe(true);
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { eventId: 'evt-abc' },
      });
    });

    it('should return false when no record with the eventId exists', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.existsByEventId('evt-unknown');

      expect(result).toBe(false);
    });
  });
});
