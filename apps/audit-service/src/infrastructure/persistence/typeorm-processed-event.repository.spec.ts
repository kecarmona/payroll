import { DataSource, Repository } from 'typeorm';
import { TypeOrmProcessedEventRepository } from './typeorm-processed-event.repository';
import { TypeOrmProcessedEventEntity } from './typeorm-processed-event.entity';

describe('TypeOrmProcessedEventRepository', () => {
  let repository: TypeOrmProcessedEventRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockTypeOrmRepo: jest.Mocked<Repository<TypeOrmProcessedEventEntity>>;

  beforeEach(() => {
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<Repository<TypeOrmProcessedEventEntity>>;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    } as unknown as jest.Mocked<DataSource>;

    repository = new TypeOrmProcessedEventRepository(mockDataSource);
  });

  describe('markProcessed', () => {
    it('should persist the event ID as processed', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmProcessedEventEntity);

      await repository.markProcessed('evt-abc');

      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
      const entity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmProcessedEventEntity;

      expect(entity.eventId).toBe('evt-abc');
    });
  });

  describe('isProcessed', () => {
    it('should return true when the event ID exists in the store', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue({
        eventId: 'evt-abc',
      } as TypeOrmProcessedEventEntity);

      const result = await repository.isProcessed('evt-abc');

      expect(result).toBe(true);
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { eventId: 'evt-abc' },
      });
    });

    it('should return false when the event ID is not in the store', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.isProcessed('evt-unknown');

      expect(result).toBe(false);
    });

    it('should return false after an event ID was processed and then the record is not found', async () => {
      // Simulate not found (event may have been cleaned up or TTL expired)
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.isProcessed('evt-expired');

      expect(result).toBe(false);
    });
  });
});
