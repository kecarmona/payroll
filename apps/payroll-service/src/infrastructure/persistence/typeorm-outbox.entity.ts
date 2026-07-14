import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * TypeORM entity for the transactional outbox table.
 *
 * Stores domain events that must be published to Kafka.
 * The outbox publisher (Phase 8) picks up rows with `publishedAt IS NULL`
 * and publishes them to the message broker.
 */
@Entity('outbox')
export class TypeOrmOutboxEntity {
  /** Primary key — the event ID (UUID v4). */
  @PrimaryColumn('uuid')
  id!: string;

  /** The domain event type string (e.g. 'PayrollJobCreated'). */
  @Column()
  eventType!: string;

  /** The aggregate ID that produced this event. */
  @Column()
  aggregateId!: string;

  /** The event payload stored as JSONB. */
  @Column('jsonb')
  payload!: unknown;

  /** Record creation timestamp. */
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;

  /** Timestamp when the event was published to Kafka (null = pending). */
  @Column({ type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;
}
