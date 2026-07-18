import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import type { ProcessedEventStore } from '../domain/processed-event-store';
import { TypeOrmProcessedEventEntity } from './typeorm-processed-event.entity';

/**
 * TypeORM-backed implementation of the {@link ProcessedEventStore} port.
 *
 * Persists processed event IDs to the `processed_events` table for
 * idempotent event processing.
 *
 * Uses the DataSource instead of injecting a repository to support
 * transactional scenarios (same DataSource as outbox).
 */
@Injectable()
export class TypeOrmProcessedEventRepository implements ProcessedEventStore {
  private readonly repository: Repository<TypeOrmProcessedEventEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmProcessedEventEntity);
  }

  async exists(eventId: string): Promise<boolean> {
    const entity = await this.repository.findOne({ where: { id: eventId } });
    return entity !== null;
  }

  async markProcessed(eventId: string, notificationId: string): Promise<void> {
    const entity = new TypeOrmProcessedEventEntity();
    entity.id = eventId;
    entity.notificationId = notificationId;
    entity.createdAt = new Date();
    await this.repository.save(entity);
  }
}
