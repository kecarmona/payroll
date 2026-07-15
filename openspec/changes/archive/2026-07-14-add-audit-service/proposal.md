# Proposal: Add Audit Service

## Intent

Create an immutable audit trail for business-critical events across all services.

## Scope

1. **New service** `apps/audit-service/` — NestJS app with PostgreSQL
2. **Kafka consumer** — subscribes to `audit.events` topic, consumes 10 audited event types
3. **Audit record** — immutable, append-only, with redaction of sensitive fields
4. **Idempotent** — duplicate events are no-ops

## Audited Events

- UserRoleChanged, EmployeeCreated, EmployeeSalaryChanged, EmployeeTerminated
- PayrollJobCreated, PayrollJobCompleted, PayrollJobFailed
- PayrollTransactionCompleted, PayrollTransactionFailed
- PayslipGenerated

## Non-goals

- Audit query API (append-only store, query later if needed)
- Real-time audit dashboard
- Audit retention/purging

## Dependencies

- `libs/contracts` — event types
- `libs/transactional-outbox` — outbox
- `libs/service-foundation` — base modules
- Docker Compose (Kafka)
