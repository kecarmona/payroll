import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * TypeORM entity for the processed_events table.
 *
 * Stores event IDs that have been processed by the notification service
 * to ensure idempotent processing of domain events.
 *
 * Each row represents a single event that was consumed and processed,
 * linked to the notification request it generated.
 */
@Entity('processed_events')
export class TypeOrmProcessedEventEntity {
  /** Primary key — the domain event ID (UUID v4) that was processed. */
  @PrimaryColumn('uuid')
  id = '';

  /** The notification request ID created for this event. */
  @Column({ name: 'notification_id' })
  notificationId = '';

  /** Record creation timestamp. */
  @Column({ type: 'timestamptz', name: 'created_at', default: () => 'NOW()' })
  createdAt: Date = new Date();
}
