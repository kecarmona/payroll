/**
 * Standard event envelope for all integration events.
 *
 * Every event published across service boundaries MUST use this envelope.
 * It provides the metadata required for routing, deduplication, tracing,
 * and schema evolution across the entire platform.
 *
 * @typeParam TPayload - The shape of the event-specific payload data.
 *
 * @example
 * ```ts
 * const event: EventEnvelope<PayrollJobCreatedPayload> = {
 *   eventId: randomUUID(),
 *   eventType: 'PayrollJobCreated',
 *   version: 1,
 *   timestamp: new Date().toISOString(),
 *   companyId: 'comp-123',
 *   correlationId: 'workflow-456',
 *   causationId: 'cmd-789',
 *   producer: 'payroll-service',
 *   payload: { jobId: 'job-001', period: '2026-01' },
 * };
 * ```
 */
export interface EventEnvelope<TPayload = unknown> {
  /** Unique identifier for this event instance (used for idempotency). */
  readonly eventId: string;

  /** Machine-readable event type name (e.g. "PayrollJobCreated"). */
  readonly eventType: string;

  /** Schema version of the event payload. */
  readonly version: number;

  /** ISO 8601 timestamp when the event was produced. */
  readonly timestamp: string;

  /** The tenant (company) this event belongs to. */
  readonly companyId: string;

  /** Workflow-level correlation identifier for distributed tracing. */
  readonly correlationId: string;

  /** Identifier of the event or command that caused this event. */
  readonly causationId: string;

  /** Name of the service that produced this event (e.g. "payroll-service"). */
  readonly producer: string;

  /** The event-specific data payload. */
  readonly payload: TPayload;
}

