# Proposal: Add Payroll Processing Service

## Intent

Create the `payroll-processing-service` — the core distributed payroll engine that consumes `PayrollJobCreated` events, creates per-employee transactions, processes them independently with retry + optimistic locking, generates immutable payslips, and emits result events.

## Scope

1. **New service** `apps/payroll-processing-service/` — NestJS app with Clean/Hexagonal architecture
2. **Domain**: PayrollTransaction aggregate (state machine: PENDING → PROCESSING → COMPLETED/FAILED), Payslip aggregate (immutable), payroll calculation domain service
3. **Application**: Consume PayrollJobCreated, create transactions, process each, generate payslips
4. **Infrastructure**: PostgreSQL persistence (TypeORM), outbox for result events, processed-event store for idempotency
5. **Interface**: Kafka consumer (via kafkajs), no REST endpoints (event-driven only)

## Non-goals

- REST API (this is an event-driven consumer only)
- Complex payroll calculation formulas (stub calculation for now — real formulas in a later phase)
- Notification/email sending (Phase 11)
- Projection updates (Phase 10)

## Dependencies

- `libs/transactional-outbox` — for outbox persistence
- `libs/event-bus` — EventSerializer, TopicRegistry
- `libs/contracts` — EventEnvelope, PayrollJobCreated
- `libs/shared-kernel` — AggregateRoot, domain events
- `libs/service-foundation` — NestJS base modules
- `apps/payroll-service` — creates the PayrollJobCreated events
- Docker Compose (Kafka for consuming events)
