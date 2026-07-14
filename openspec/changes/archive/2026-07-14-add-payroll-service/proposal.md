# Proposal: Payroll Service — Job Orchestration (Phase 7)

## Intent

Enable HR/ADMIN users to create payroll jobs for a company and period. Payroll Service owns payroll periods and job lifecycle — it orchestrates *when* payroll starts but never performs calculations. Combines `add-payroll-service` and `implement-create-payroll-job` into a single delivery.

## Scope

### In Scope
- PayrollPeriod aggregate — calendar period management (creation, validation, status)
- PayrollJob aggregate with state machine: CREATED → PROCESSING → COMPLETED → FAILED
- `POST /payroll/jobs` with `Idempotency-Key` header and RBAC (HR/ADMIN)
- Idempotency storage: request hash → response cache (per ADR 0006)
- One-job-per-period rule: unique constraint on (companyId, payrollPeriodId)
- Outbox table schema + write-side storage in same ACID transaction
- PostgreSQL via TypeORM + migrations
- Swagger docs (per auth-service pattern)
- Unit + integration + E2E tests

### Out of Scope
- Kafka publishing (Phase 8: `add-transactional-outbox`)
- Payroll processing (Phase 9)
- Projections (Phase 10)

## Capabilities

### New Capabilities
- `payroll-service`: NestJS scaffold with ConfigModule, TypeORM, ValidationPipe, Swagger, health endpoint
- `payroll-period`: PayrollPeriod aggregate — creation, validation, lifecycle
- `payroll-job`: PayrollJob aggregate — state machine, unique constraint, domain event recording

### Modified Capabilities
None

## Approach

NestJS service following auth-service patterns. Two TypeORM entities (`PayrollPeriod`, `PayrollJob`) with dedicated tables. `CreatePayrollJobHandler` validates request → checks unique constraint → persists job + records `PayrollJobCreated` domain event → stored in outbox table within same TypeORM transaction. Idempotency check occurs before handler (filter/interceptor reads Idempotency-Key, checks cache, returns stored response or proceeds).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/payroll-service/` | New | Full service: domain aggregates, handlers, persistence, controller, migrations |
| `libs/contracts/src/lib/` | Minor | `PayrollJobCreated` v1 payload shape (companyId, periodId, jobId, timestamp) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Outbox row missing if job insert succeeds but outbox fails | Low | Same TypeORM transaction — both commit or rollback atomically |
| Idempotency hash collisions | Low | Hash normalized JSON payload; unique constraint on (key, hash) |

## Rollback Plan

Revert TypeORM migrations (`down`), remove `payroll-service` app module and controller, restore `libs/contracts` if payload shape changed.

## Dependencies

- Phase 0–6 complete (shared-kernel, contracts, service-foundation, auth, employee)
- `libs/contracts` — `PayrollJobCreated` event type exists at version 1 (confirmed in `event-versions.ts`)

## Success Criteria

- [ ] `POST /payroll/jobs` creates a PayrollJob + stores `PayrollJobCreated` in outbox
- [ ] Idempotency-Key replay returns original response (same payload → 200)
- [ ] Idempotency-Key with different payload returns 409 Conflict
- [ ] Duplicate company+period returns 409 Conflict
- [ ] Missing Idempotency-Key returns 400 Bad Request
- [ ] Unauthorized / forbidden requests return 401 / 403
