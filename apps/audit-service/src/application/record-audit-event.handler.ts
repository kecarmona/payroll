import { randomUUID } from 'crypto';
import { AuditRecord } from '../domain/audit-record.entity';
import type { AuditRecordRepository } from '../domain/audit-record.repository';
import type { ProcessedEventStore } from '../domain/processed-event-store';
import { RedactionService } from '../domain/redaction.service';

/**
 * Input data for recording an audited event.
 */
export interface RecordAuditEventInput {
  /** The source domain event's unique identifier. */
  readonly eventId: string;
  /** Machine-readable event type name. */
  readonly eventType: string;
  /** The tenant (company) this event belongs to. */
  readonly companyId: string;
  /** Workflow-level correlation identifier. */
  readonly correlationId: string;
  /** The raw event payload (may contain sensitive fields). */
  readonly payload: Record<string, unknown>;
  /** ISO timestamp when the original event occurred. */
  readonly occurredAt: Date;
}

/**
 * Application handler that orchestrates audit record creation.
 *
 * This handler implements the full audit workflow:
 * 1. **Idempotency check** — skip if the event was already processed.
 * 2. **Redaction** — strip sensitive fields from the payload.
 * 3. **Record creation** — build an immutable `AuditRecord`.
 * 4. **Persistence** — store the record in the audit repository.
 * 5. **Mark processed** — record the event ID in the processed store.
 *
 * @example
 * ```ts
 * await handler.handle({
 *   eventId: 'evt-abc',
 *   eventType: 'PayrollJobCreated',
 *   companyId: 'comp-1',
 *   correlationId: 'corr-xyz',
 *   payload: { jobId: 'job-001', ssn: '123-45-6789' },
 *   occurredAt: new Date(),
 * });
 * ```
 */
export class RecordAuditEventHandler {
  constructor(
    private readonly auditRecordRepository: AuditRecordRepository,
    private readonly processedEventStore: ProcessedEventStore,
    private readonly redactionService: RedactionService,
  ) {}

  /**
   * Processes an audited event: creates and persists an audit record.
   *
   * If the event was already processed (same `eventId`), this is a no-op.
   *
   * @param input - The event data to audit.
   */
  async handle(input: RecordAuditEventInput): Promise<void> {
    // 1. Idempotency check — skip if already processed.
    const alreadyProcessed = await this.processedEventStore.isProcessed(input.eventId);
    if (alreadyProcessed) {
      return;
    }

    // 2. Redact sensitive fields from the payload.
    const payloadSummary = this.redactionService.redact(input.payload);

    // 3. Create the immutable audit record.
    const record = AuditRecord.create({
      id: randomUUID(),
      eventId: input.eventId,
      eventType: input.eventType,
      companyId: input.companyId,
      correlationId: input.correlationId,
      payloadSummary,
      occurredAt: input.occurredAt,
    });

    // 4. Persist the audit record.
    await this.auditRecordRepository.save(record);

    // 5. Mark as processed for future idempotency checks.
    await this.processedEventStore.markProcessed(input.eventId);
  }
}
