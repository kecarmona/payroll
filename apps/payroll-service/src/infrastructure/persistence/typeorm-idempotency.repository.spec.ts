import { DataSource, Repository } from 'typeorm';
import { TypeOrmIdempotencyRepository } from './typeorm-idempotency.repository';
import { TypeOrmIdempotencyEntity } from './typeorm-idempotency.entity';
import type { IdempotencyRecord } from '../../domain/idempotency-store';

describe('TypeOrmIdempotencyRepository', () => {
  let repository: TypeOrmIdempotencyRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockTypeOrmRepo: jest.Mocked<Repository<TypeOrmIdempotencyEntity>>;

  beforeEach(() => {
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<TypeOrmIdempotencyEntity>>;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    } as unknown as jest.Mocked<DataSource>;

    repository = new TypeOrmIdempotencyRepository(mockDataSource);
  });

  describe('findByKey', () => {
    it('should return null when key is not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByKey('unknown-key');

      expect(result).toBeNull();
    });

    it('should return an IdempotencyRecord when key is found', async () => {
      const createdAt = new Date();
      const entity: TypeOrmIdempotencyEntity = {
        key: 'known-key',
        requestHash: 'abc123hash',
        responseStatus: 201,
        responseBody: { jobId: 'j-123', status: 'CREATED' },
        createdAt,
      } as TypeOrmIdempotencyEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByKey('known-key');

      expect(result).not.toBeNull();
      expect(result!.key).toBe('known-key');
      expect(result!.requestHash).toBe('abc123hash');
      expect(result!.responseStatus).toBe(201);
      expect(result!.responseBody).toEqual({ jobId: 'j-123', status: 'CREATED' });
      expect(result!.createdAt).toBe(createdAt);
    });
  });

  describe('save', () => {
    it('should persist the idempotency record via TypeORM repository', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmIdempotencyEntity);

      const record: IdempotencyRecord = {
        key: 'new-key',
        requestHash: 'def456hash',
        responseStatus: 200,
        responseBody: { ok: true },
        createdAt: new Date(),
      };

      await repository.save(record);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
      const savedEntity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmIdempotencyEntity;

      expect(savedEntity.key).toBe('new-key');
      expect(savedEntity.requestHash).toBe('def456hash');
      expect(savedEntity.responseStatus).toBe(200);
      expect(savedEntity.responseBody).toEqual({ ok: true });
    });
  });
});
