import { DataSource, Repository } from 'typeorm';
import { TypeOrmOutboxRepository } from './typeorm-outbox.repository';
import { TypeOrmOutboxEntity } from './typeorm-outbox.entity';

describe('TypeOrmOutboxRepository', () => {
  let repository: TypeOrmOutboxRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockTypeOrmRepo: jest.Mocked<Repository<TypeOrmOutboxEntity>>;

  beforeEach(() => {
    mockTypeOrmRepo = {
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<TypeOrmOutboxEntity>>;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    } as unknown as jest.Mocked<DataSource>;

    repository = new TypeOrmOutboxRepository(mockDataSource);
  });

  describe('save', () => {
    it('should persist the outbox event via TypeORM repository', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmOutboxEntity);

      const event = {
        id: 'evt-123',
        eventType: 'PayrollJobCreated',
        aggregateId: 'job-456',
        payload: { jobId: 'job-456', companyId: 'comp-1' },
      };

      await repository.save(event);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
      const savedEntity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmOutboxEntity;

      expect(savedEntity.id).toBe('evt-123');
      expect(savedEntity.eventType).toBe('PayrollJobCreated');
      expect(savedEntity.aggregateId).toBe('job-456');
      expect(savedEntity.payload).toEqual(event.payload);
      expect(savedEntity.publishedAt).toBeNull();
      expect(savedEntity.retryCount).toBe(0);
      expect(savedEntity.lastError).toBeNull();
      expect(savedEntity.createdAt).toBeInstanceOf(Date);
    });

    it('should persist a different event type with its specific payload', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmOutboxEntity);

      const event = {
        id: 'evt-456',
        eventType: 'PayrollPeriodCreated',
        aggregateId: 'period-789',
        payload: { periodId: 'period-789', month: 7, year: 2026 },
      };

      await repository.save(event);

      const savedEntity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmOutboxEntity;
      expect(savedEntity.id).toBe('evt-456');
      expect(savedEntity.eventType).toBe('PayrollPeriodCreated');
      expect(savedEntity.payload).toEqual(event.payload);
    });

    it('should throw when TypeORM save fails', async () => {
      mockTypeOrmRepo.save.mockRejectedValue(new Error('DB connection error'));

      const event = {
        id: 'evt-789',
        eventType: 'TestEvent',
        aggregateId: 'agg-001',
        payload: {},
      };

      await expect(repository.save(event)).rejects.toThrow('DB connection error');
    });
  });
});
