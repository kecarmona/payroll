import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import type { IdempotencyStore, IdempotencyRecord } from '../../domain/idempotency-store';
import { TypeOrmIdempotencyEntity } from './typeorm-idempotency.entity';

/**
 * TypeORM-backed implementation of the {@link IdempotencyStore} port.
 *
 * Converts between domain {@link IdempotencyRecord} and the
 * {@link TypeOrmIdempotencyEntity} persistence model.
 */
@Injectable()
export class TypeOrmIdempotencyRepository implements IdempotencyStore {
  private readonly repository: Repository<TypeOrmIdempotencyEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmIdempotencyEntity);
  }

  async findByKey(key: string): Promise<IdempotencyRecord | null> {
    const entity = await this.repository.findOne({ where: { key } });
    if (!entity) {
      return null;
    }
    return {
      key: entity.key,
      requestHash: entity.requestHash,
      responseStatus: entity.responseStatus,
      responseBody: entity.responseBody,
      createdAt: entity.createdAt,
    };
  }

  async save(record: IdempotencyRecord): Promise<void> {
    const entity = new TypeOrmIdempotencyEntity();
    entity.key = record.key;
    entity.requestHash = record.requestHash;
    entity.responseStatus = record.responseStatus;
    entity.responseBody = record.responseBody;
    entity.createdAt = record.createdAt;
    await this.repository.save(entity);
  }
}
