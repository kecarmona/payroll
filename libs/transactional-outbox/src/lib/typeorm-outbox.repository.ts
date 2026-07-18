import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import type { OutboxStore } from './outbox-store';
import { TypeOrmOutboxEntity } from './typeorm-outbox.entity';

/**
 * TypeORM-backed implementation of the {@link OutboxStore} port.
 *
 * Converts outbox event data to {@link TypeOrmOutboxEntity} and persists
 * it to the `outbox` table. Uses the DataSource to obtain a repository
 * instance, which supports transactional scenarios when run within a
 * TypeORM transaction manager.
 */
@Injectable()
export class TypeOrmOutboxRepository implements OutboxStore {
  private readonly repository: Repository<TypeOrmOutboxEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmOutboxEntity);
  }

  async save(event: {
    id: string;
    eventType: string;
    aggregateId: string;
    payload: unknown;
  }): Promise<void> {
    const entity = new TypeOrmOutboxEntity();
    entity.id = event.id;
    entity.eventType = event.eventType;
    entity.aggregateId = event.aggregateId;
    entity.payload = event.payload;
    entity.createdAt = new Date();
    entity.publishedAt = null;
    entity.retryCount = 0;
    entity.lastError = null;
    await this.repository.save(entity);
  }
}
