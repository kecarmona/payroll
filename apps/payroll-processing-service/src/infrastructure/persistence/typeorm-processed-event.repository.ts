import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import type { ProcessedEventStore } from '../../domain/processed-event-store';
import { TypeOrmProcessedEventEntity } from './typeorm-processed-event.entity';

/**
 * TypeORM-backed implementation of the {@link ProcessedEventStore} port.
 *
 * Uses the `processed_events` table to track which external events have
 * been consumed, enabling exactly-once processing semantics.
 */
@Injectable()
export class TypeOrmProcessedEventRepository implements ProcessedEventStore {
  private readonly repository: Repository<TypeOrmProcessedEventEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmProcessedEventEntity);
  }

  async isProcessed(eventId: string): Promise<boolean> {
    const entity = await this.repository.findOne({ where: { eventId } });
    return entity !== null;
  }

  async markAsProcessed(eventId: string): Promise<void> {
    const entity = new TypeOrmProcessedEventEntity();
    entity.eventId = eventId;
    entity.processedAt = new Date();
    await this.repository.save(entity);
  }
}
