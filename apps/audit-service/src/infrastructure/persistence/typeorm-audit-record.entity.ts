import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

/**
 * TypeORM entity mapping the AuditRecord to the `audit_records` table.
 *
 * This entity represents the persistent storage shape of the domain
 * {@link AuditRecord}. It is append-only — records are never updated
 * or deleted. The `eventId` column has a unique index for idempotency
 * checks.
 *
 * ## Schema
 *
 * | Column | Type | Notes |
 * |---|---|---|
 * | id | varchar (PK) | UUID v4 |
 * | eventId | varchar (unique) | Source event ID for idempotency |
 * | eventType | varchar | e.g. "PayrollJobCreated" |
 * | companyId | varchar | Tenant ID |
 * | correlationId | varchar | Correlation chain |
 * | payloadSummary | simple-json | Redacted payload (sensitive fields removed) |
 * | occurredAt | timestamptz | When the original event occurred |
 * | recordedAt | timestamptz | When audit record was created |
 */
@Entity('audit_records')
@Index('idx_audit_event_id', ['eventId'], { unique: true })
@Index('idx_audit_company_event', ['companyId', 'eventType'])
@Index('idx_audit_occurred_at', ['occurredAt'])
export class TypeOrmAuditRecordEntity {
  /** Primary key — UUID v4. */
  @PrimaryColumn('varchar')
  id!: string;

  /** Source event ID — unique index for idempotency. */
  @Column()
  eventId!: string;

  /** Machine-readable event type name (e.g. "PayrollJobCreated"). */
  @Column()
  eventType!: string;

  /** Tenant (company) this record belongs to. */
  @Column()
  companyId!: string;

  /** Workflow-level correlation identifier. */
  @Column({ nullable: true })
  correlationId!: string;

  /** Redacted payload stored as JSON. */
  @Column('simple-json')
  payloadSummary!: Record<string, unknown>;

  /** ISO timestamp when the original event occurred. */
  @Column('timestamptz')
  occurredAt!: Date;

  /** ISO timestamp when the audit record was created. */
  @Column('timestamptz')
  recordedAt!: Date;
}
