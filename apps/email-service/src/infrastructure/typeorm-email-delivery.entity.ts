import { Entity, Column, PrimaryColumn } from 'typeorm';
import type { EmailStatus } from '../domain/email-status';

/**
 * TypeORM entity for the email_deliveries table.
 *
 * Stores email delivery aggregates that track the status of each
 * outbound email sent by the Email Service.
 */
@Entity('email_deliveries')
export class TypeOrmEmailDeliveryEntity {
  /** Primary key — the email delivery ID (UUID v4). */
  @PrimaryColumn('uuid')
  id = '';

  /** The recipient email address. */
  @Column()
  to = '';

  /** The email subject line. */
  @Column()
  subject = '';

  /** The email body content. */
  @Column('text')
  body = '';

  /** The current delivery status (PENDING, SENT, FAILED). */
  @Column()
  status: EmailStatus = 'PENDING' as EmailStatus;

  /** The tenant (company) this email belongs to. */
  @Column({ name: 'company_id' })
  companyId = '';

  /** Record creation timestamp. */
  @Column({ type: 'timestamptz', name: 'created_at', default: () => 'NOW()' })
  createdAt: Date = new Date();

  /** Number of delivery attempts made for this email. */
  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount = 0;

  /** Optimistic concurrency version. */
  @Column({ type: 'int', default: 0 })
  version = 0;
}
