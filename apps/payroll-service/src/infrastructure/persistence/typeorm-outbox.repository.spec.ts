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
        payload: { jobId: 'job-456', companyId: 'comp-1', periodId: 'period-1', timestamp: '2026-07-14T12:00:00Z' },
      };

      await repository.save(event);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
      const savedEntity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmOutboxEntity;

      expect(savedEntity.id).toBe('evt-123');
      expect(savedEntity.eventType).toBe('PayrollJobCreated');
      expect(savedEntity.aggregateId).toBe('job-456');
      expect(savedEntity.payload).toEqual(event.payload);
      expect(savedEntity.publishedAt).toBeNull();
      expect(savedEntity.createdAt).toBeInstanceOf(Date);
    });
  });
});
