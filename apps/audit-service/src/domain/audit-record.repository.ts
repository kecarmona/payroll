import { AuditRecord } from './audit-record.entity';

/**
 * Port interface for persisting audit records.
 *
 * The audit store is **append-only** — records are never updated or deleted.
 * Implementations typically use a PostgreSQL table with an index on `eventId`
 * for idempotency checks.
 */
export interface AuditRecordRepository {
  /**
   * Persists an audit record.
   *
   * The implementation MUST use `eventId` as the idempotency key.
   * If a record with the same `eventId` already exists, the operation
   * MUST be a no-op (not throw, not update).
   *
   * @param record - The audit record to persist.
   */
  save(record: AuditRecord): Promise<void>;

  /**
   * Checks whether an audit record already exists for the given event ID.
   *
   * Used by the idempotency guard before processing an event.
   *
   * @param eventId - The source event's unique identifier.
   * @returns `true` if a record with this eventId already exists.
   */
  existsByEventId(eventId: string): Promise<boolean>;
}
