import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * TypeORM entity for tracking processed events (idempotency).
 *
 * Each row records an external event that has been consumed so that
 * replays can be safely ignored (exactly-once processing semantics).
 */
@Entity('processed_events')
export class TypeOrmProcessedEventEntity {
  /** The unique event ID that was processed. */
  @PrimaryColumn('uuid')
  eventId!: string;

  /** Timestamp when the event was processed. */
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  processedAt!: Date;
}
