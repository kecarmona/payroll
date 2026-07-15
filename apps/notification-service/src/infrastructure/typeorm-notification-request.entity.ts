import { Entity, Column, PrimaryColumn } from 'typeorm';
import type { NotificationStatus } from '../domain/notification-status';

/**
 * TypeORM entity for the notification_requests table.
 *
 * Stores notification request aggregates that track the delivery
 * status of notifications triggered by domain events.
 */
@Entity('notification_requests')
export class TypeOrmNotificationRequestEntity {
  /** Primary key — the notification request ID (UUID v4). */
  @PrimaryColumn('uuid')
  id = '';

  /** The domain event ID that triggered this notification. */
  @Column({ name: 'event_id' })
  eventId = '';

  /** The notification channel type (e.g. 'EMAIL'). */
  @Column()
  type = '';

  /** The target recipient identifier. */
  @Column({ name: 'recipient_id' })
  recipientId = '';

  /** The current delivery status (PENDING, SENT, FAILED). */
  @Column()
  status: NotificationStatus = 'PENDING' as NotificationStatus;

  /** The tenant (company) this notification belongs to. */
  @Column({ name: 'company_id' })
  companyId = '';

  /** Record creation timestamp. */
  @Column({ type: 'timestamptz', name: 'created_at', default: () => 'NOW()' })
  createdAt: Date = new Date();

  /** Optimistic concurrency version. */
  @Column({ type: 'int', default: 0 })
  version = 0;
}
