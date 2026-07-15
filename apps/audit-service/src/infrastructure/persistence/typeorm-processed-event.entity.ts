import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

/**
 * TypeORM entity for tracking processed event IDs (idempotency).
 *
 * This table stores the unique `eventId` of every event that has been
 * successfully processed by the audit service. Before processing a new
 * event, the service checks whether its `eventId` already exists here.
 *
 * The table is append-only with a simple primary key on `eventId`.
 * Automatic cleanup of old rows can be implemented via a scheduled job
 * or TTL-based partition management if desired.
 *
 * @see {@link ProcessedEventStore} for the domain port interface.
 */
@Entity('processed_events')
export class TypeOrmProcessedEventEntity {
  /** The source event's unique identifier (used as the primary key). */
  @PrimaryColumn('varchar')
  eventId!: string;

  /** Timestamp when this event was processed. */
  @CreateDateColumn()
  processedAt!: Date;
}
