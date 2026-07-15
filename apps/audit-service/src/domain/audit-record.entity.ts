import { Entity } from '@payroll/shared-kernel';

/**
 * Properties required to create a new AuditRecord.
 */
export interface AuditRecordProps {
  /** Unique identifier for this audit record. */
  readonly id: string;
  /** The source domain event's unique identifier (used for idempotency). */
  readonly eventId: string;
  /** Machine-readable event type name (e.g. "PayrollJobCreated"). */
  readonly eventType: string;
  /** The tenant (company) this record belongs to. */
  readonly companyId: string;
  /** Workflow-level correlation identifier for distributed tracing. */
  readonly correlationId: string;
  /** Redacted payload summary — sensitive fields replaced by '[REDACTED]'. */
  readonly payloadSummary: Record<string, unknown>;
  /** ISO timestamp when the original event occurred. */
  readonly occurredAt: Date;
  /** ISO timestamp when this audit record was created. Defaults to now. */
  readonly recordedAt?: Date;
}

/**
 * Immutable audit record for business-critical domain events.
 *
 * An `AuditRecord` is an append-only entry in the audit trail. Once created,
 * its properties cannot be modified (the instance is frozen). Records are
 * identified by `(id, companyId)` for entity equality.
 *
 * The audit service creates one `AuditRecord` per consumed audited event.
 * Duplicate events are detected via {@link AuditRecord.eventId} and ignored.
 *
 * @example
 * ```ts
 * const record = AuditRecord.create({
 *   id: randomUUID(),
 *   eventId: 'evt-abc-123',
 *   eventType: 'PayrollJobCreated',
 *   companyId: 'comp-1',
 *   correlationId: 'corr-xyz',
 *   payloadSummary: { jobId: 'job-001' },
 *   occurredAt: new Date('2026-07-01T10:00:00Z'),
 * });
 * ```
 */
export class AuditRecord extends Entity<string> {
  /** The source domain event's unique identifier (used for idempotency). */
  public readonly eventId: string;

  /** Machine-readable event type name (e.g. "PayrollJobCreated"). */
  public readonly eventType: string;

  /** Workflow-level correlation identifier for distributed tracing. */
  public readonly correlationId: string;

  /** Redacted payload summary — sensitive fields replaced by '[REDACTED]'. */
  public readonly payloadSummary: Record<string, unknown>;

  /** ISO timestamp when the original event occurred. */
  public readonly occurredAt: Date;

  /** ISO timestamp when this audit record was created. */
  public readonly recordedAt: Date;

  private constructor(props: AuditRecordProps) {
    super(props.id, props.companyId);
    this.eventId = props.eventId;
    this.eventType = props.eventType;
    this.correlationId = props.correlationId;
    this.payloadSummary = Object.freeze({ ...props.payloadSummary });
    this.occurredAt = props.occurredAt;
    this.recordedAt = props.recordedAt ?? new Date();

    // Freeze the instance for immutability guarantees.
    Object.freeze(this);
  }

  /**
   * Creates a new immutable AuditRecord.
   *
   * @param props - The properties for the audit record.
   * @returns A frozen AuditRecord instance.
   */
  static create(props: AuditRecordProps): AuditRecord {
    return new AuditRecord(props);
  }
}
