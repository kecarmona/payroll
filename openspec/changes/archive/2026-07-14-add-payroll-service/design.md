# Design: Payroll Service — Job Orchestration

## Technical Approach

Clean Architecture payroll service following the auth-service pattern exactly. Two aggregates (`PayrollPeriod`, `PayrollJob`) in the domain layer. Commands (`CreatePayrollPeriod`, `CreatePayrollJob`) flow through handlers that depend only on domain port interfaces. The `CreatePayrollJob` handler runs inside a TypeORM transaction that writes the aggregate, the outbox row, and the idempotency record atomically. Idempotency is enforced at the controller level via a dedicated guard before the handler executes. NestJS wires infrastructure (TypeORM repositories, outbox store, idempotency store) at the edges via string DI tokens.

## Architecture Decisions

### Decision: IdempotencyGuard as request-scoped guard

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inside handler | Couples business logic to idempotency concerns; complicates testing | ❌ |
| Express middleware | Can't access NestJS DI easily; feels foreign to NestJS patterns | ❌ |
| NestJS guard on controller method | Clean separation; guard reads header, checks store, returns stored response or passes through; handler never knows about idempotency | ✅ |

### Decision: Outbox written in same TypeORM transaction as aggregate

The handler receives a `DataSource` (not a repository) and orchestrates the transaction manually via `DataSource.transaction()`. The aggregate is saved, the outbox row is inserted, and the idempotency record is inserted in a single `manager.save()` call chain.

### Decision: PayrollPeriod and PayrollJob as separate aggregates

PayrollPeriod manages calendar periods; PayrollJob tracks job lifecycle. Different consistency boundaries, different query patterns. Periods are referenced by FK from jobs but never loaded as children (referential integrity only).

### Decision: Use `PAYROL_REPOSITORY_TOKEN`-style string tokens matching auth-service

Consistent DI wiring across all services — `'PayrollPeriodRepository'`, `'PayrollJobRepository'`, `'IdempotencyStore'`, `'OutboxStore'`.

## Data Flow

```
POST /payroll/jobs { companyId, payrollPeriodId }
  ┌─ IdempotencyGuard ─────────────────────────────┐
  │ 1. Extract Idempotency-Key. Missing → 400       │
  │ 2. Look up key in idempotency table.             │
  │    Found + same hash → return cached 200         │
  │    Found + diff hash → return 409 Conflict       │
  │    Not found → pass through                       │
  └──────────────────────────────────────────────────┘
  │
  ▼
Controller → CreatePayrollJobHandler
  │
  ▼
DataSource.transaction(manager => {
  1. Validate period exists + belongs to company
  2. Check no job exists for (companyId, periodId) → 409
  3. Create PayrollJob aggregate → record PayrollJobCreated
  4. manager.save(jobEntity)
  5. manager.save(outboxEntity)
  6. manager.save(idempotencyEntity)
  // All or nothing
})
  │
  ▼
201 Created + response (jobId, status: "CREATED")
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/payroll-service/src/domain/payroll-period.ts` | Create | PayrollPeriod aggregate: month, year, dates, isClosed |
| `apps/payroll-service/src/domain/payroll-job.ts` | Create | PayrollJob aggregate: status machine, domain event recording |
| `apps/payroll-service/src/domain/payroll-job-status.ts` | Create | ValueObject: CREATED \| PROCESSING \| COMPLETED \| FAILED |
| `apps/payroll-service/src/domain/payroll-period.repository.ts` | Create | Port: save, findById, findByCompanyAndMonth |
| `apps/payroll-service/src/domain/payroll-job.repository.ts` | Create | Port: save, findById, findByCompanyAndPeriod |
| `apps/payroll-service/src/domain/events/payroll-job-created.event.ts` | Create | DomainEvent using PayrollEventType.PayrollJobCreated |
| `apps/payroll-service/src/domain/idempotency-store.ts` | Create | Port: findByKey, save |
| `apps/payroll-service/src/domain/outbox-store.ts` | Create | Port: save |
| `apps/payroll-service/src/application/create-payroll-period.handler.ts` | Create | Command + Handler |
| `apps/payroll-service/src/application/create-payroll-job.handler.ts` | Create | Command + Handler with transaction scope |
| `apps/payroll-service/src/application/get-payroll-periods.handler.ts` | Create | Query handler |
| `apps/payroll-service/src/application/get-payroll-job.handler.ts` | Create | Query handler |
| `apps/payroll-service/src/application/errors.ts` | Create | Payroll-specific DomainError subclasses |
| `apps/payroll-service/src/interface/payroll.controller.ts` | Create | 5 endpoints with Swagger docs |
| `apps/payroll-service/src/interface/dto/*.ts` | Create | DTOs: CreatePeriod, CreateJob, JobResponse, PeriodResponse |
| `apps/payroll-service/src/interface/guards/idempotency.guard.ts` | Create | Checks Idempotency-Key before execution |
| `apps/payroll-service/src/infrastructure/persistence/typeorm-payroll-period.entity.ts` | Create | TypeORM @Entity for payroll_periods |
| `apps/payroll-service/src/infrastructure/persistence/typeorm-payroll-job.entity.ts` | Create | TypeORM @Entity for payroll_jobs |
| `apps/payroll-service/src/infrastructure/persistence/typeorm-idempotency.entity.ts` | Create | TypeORM @Entity for idempotency |
| `apps/payroll-service/src/infrastructure/persistence/typeorm-outbox.entity.ts` | Create | TypeORM @Entity for outbox |
| `apps/payroll-service/src/infrastructure/persistence/typeorm-payroll-period.repository.ts` | Create | Implements PayrollPeriodRepository |
| `apps/payroll-service/src/infrastructure/persistence/typeorm-payroll-job.repository.ts` | Create | Implements PayrollJobRepository |
| `apps/payroll-service/src/infrastructure/persistence/typeorm-idempotency.repository.ts` | Create | Implements IdempotencyStore |
| `apps/payroll-service/src/infrastructure/persistence/typeorm-outbox.repository.ts` | Create | Implements OutboxStore |
| `apps/payroll-service/src/infrastructure/payroll.module.ts` | Create | NestJS module with DI wiring |
| `apps/payroll-service/src/app.module.ts` | Modify | Import PayrollModule + TypeOrmModule + ConfigModule + Swagger |
| `apps/payroll-service/src/main.ts` | Modify | Add Swagger setup |
| `apps/payroll-service/test/unit/domain/*.spec.ts` | Create | Pure domain tests |
| `apps/payroll-service/test/integration/*.spec.ts` | Create | Repository tests |

## Interfaces / Contracts

```typescript
// Domain event payload (matches event-versions.ts: version 1)
interface PayrollJobCreatedPayload {
  jobId: string;
  companyId: string;
  periodId: string;
  timestamp: string;
}

// Idempotency store port
interface IdempotencyStore {
  findByKey(key: string): Promise<IdempotencyRecord | null>;
  save(record: IdempotencyRecord): Promise<void>;
}

// Outbox store port
interface OutboxStore {
  save(event: { id: string; eventType: string; aggregateId: string; payload: unknown }): Promise<void>;
}

// Job response DTO
interface JobResponse {
  id: string;
  companyId: string;
  payrollPeriodId: string;
  status: string;
  createdAt: string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | PayrollJobStatus transitions, PayrollPeriod invariants, domain event recording | Pure domain, no infra |
| Unit | CreatePayrollJobHandler with mocked repos/store | Mock all domain ports |
| Unit | IdempotencyGuard (key missing, cache hit, hash mismatch) | NestJS TestingModule |
| Integration | TypeORM repositories — CRUD, unique constraints, transaction rollback | Testcontainers PostgreSQL |
| E2E | POST /periods → POST /jobs → replay idempotency → duplicate period → query | supertest + app |

## Migration / Rollout

No migration required for initial deploy. TypeORM `synchronize: true` for dev; dedicated migration file for production. Idempotency records have 24h TTL — implement a background cleanup job in a later hardening phase.

## Open Questions

- [ ] Should IdempotencyGuard handle non-2xx responses (e.g., cache 409 from validation failures)?
- [ ] Do we need a dedicated `PAYROLL_SERVICE_PORT` env var check in docker-compose, or is the 3003 default sufficient?
