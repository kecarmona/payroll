import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * TypeORM entity for the idempotency table.
 *
 * Stores previously processed requests to enable safe replay.
 * Records have a 24-hour TTL (cleanup is handled by a background job).
 */
@Entity('idempotency')
export class TypeOrmIdempotencyEntity {
  /** Primary key — the idempotency key value. */
  @PrimaryColumn()
  key!: string;

  /** SHA-256 hash of the request payload for conflict detection. */
  @Column('varchar')
  requestHash!: string;

  /** HTTP status code from the original response. */
  @Column('integer')
  responseStatus!: number;

  /** JSON response body from the original response. */
  @Column('jsonb', { nullable: true })
  responseBody!: unknown;

  /** Record creation timestamp. */
  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  createdAt!: Date;
}
