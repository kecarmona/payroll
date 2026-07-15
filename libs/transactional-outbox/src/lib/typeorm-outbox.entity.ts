import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * TypeORM entity for the transactional outbox table.
 *
 * Stores domain events that must be published to Kafka.
 * The outbox publisher picks up rows with `publishedAt IS NULL`
 * and publishes them to the message broker.
 *
 * Each row tracks publication state (`publishedAt`), retry count
 * for resilience, and the last error message for observability.
 */
@Entity('outbox')
export class TypeOrmOutboxEntity {
  /** Primary key — the event ID (UUID v4). */
  @PrimaryColumn('uuid')
  id = '';

  /** The domain event type string (e.g. 'PayrollJobCreated'). */
  @Column()
  eventType = '';

  /** The aggregate ID that produced this event. */
  @Column()
  aggregateId = '';

  /** The event payload stored as JSONB. */
  @Column('jsonb')
  payload!: unknown;

  /** Record creation timestamp. */
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date = new Date();

  /** Timestamp when the event was published to Kafka (null = pending). */
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt: Date | null = null;

  /** Number of publish attempts made for this record (default: 0). */
  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount = 0;

  /** Last error message captured on publish failure (null if never failed). */
  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError: string | null = null;
}
