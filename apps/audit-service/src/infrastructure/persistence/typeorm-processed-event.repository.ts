import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import type { ProcessedEventStore } from '../../domain/processed-event-store';
import { TypeOrmProcessedEventEntity } from './typeorm-processed-event.entity';

/**
 * TypeORM-backed implementation of the {@link ProcessedEventStore} port.
 *
 * Stores processed event IDs in a dedicated `processed_events` table.
 * The `eventId` is the primary key, which naturally prevents duplicates.
 */
@Injectable()
export class TypeOrmProcessedEventRepository implements ProcessedEventStore {
  private readonly repository: Repository<TypeOrmProcessedEventEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmProcessedEventEntity);
  }

  /**
   * Marks an event as processed.
   *
   * If the event ID already exists, TypeORM's save behaves as a no-op
   * since `eventId` is the primary key.
   *
   * @param eventId - The unique identifier of the processed event.
   */
  async markProcessed(eventId: string): Promise<void> {
    const entity = new TypeOrmProcessedEventEntity();
    entity.eventId = eventId;
    await this.repository.save(entity);
  }

  /**
   * Checks whether an event has already been processed.
   *
   * @param eventId - The unique identifier of the event to check.
   * @returns `true` if the event was already processed.
   */
  async isProcessed(eventId: string): Promise<boolean> {
    const entity = await this.repository.findOne({
      where: { eventId },
    });

    return entity !== null;
  }
}
