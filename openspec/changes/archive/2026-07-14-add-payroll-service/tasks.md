# Tasks: Payroll Service — Job Orchestration (Phase 7)

## Review Workload Forecast

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

| Field | Value |
|-------|-------|
| Estimated changed lines | 2000–2800 |
| 800-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Domain + Application) → PR 2 (Infrastructure + Interface + Wiring) |
| Delivery strategy | single-pr-default |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain aggregates + Application commands/handlers | PR 1 | Pure logic + mocked tests; base = feature/tracker branch |
| 2 | Infrastructure + Interface + Wiring | PR 2 | NestJS entities, repos, module, controller, app.module; base = PR 1 branch |

## Phase 1: Domain (TDD — test-first)

- [x] 1.1 `domain/payroll-period-id.ts` — `Id<'PayrollPeriodId'>` + spec
- [x] 1.2 `domain/payroll-job-id.ts` — `Id<'PayrollJobId'>` + spec
- [x] 1.3 `domain/payroll-job-status.ts` — enum `CREATED | PROCESSING | COMPLETED | FAILED` + spec
- [x] 1.4 `domain/payroll-period.entity.ts` — `AggregateRoot`: month, year, dates, isClosed + spec
- [x] 1.5 `domain/payroll-job.entity.ts` — `AggregateRoot`: status machine, domain event recording + spec
- [x] 1.6 `domain/payroll-period.repository.ts` — port: `save`, `findById`, `findByCompanyAndMonth`
- [x] 1.7 `domain/payroll-job.repository.ts` — port: `save`, `findById`, `findByCompanyAndPeriod`
- [x] 1.8 `domain/idempotency-store.ts` — port: `findByKey`, `save`
- [x] 1.9 `domain/outbox-store.ts` — port: `save`
- [x] 1.10 `domain/errors.ts` — `PayrollPeriodNotFoundError`, `DuplicatePayrollJobError`, `InvalidStatusTransitionError`
- [x] 1.11 `domain/events/payroll-period-created.event.ts` + `domain/events/payroll-job-created.event.ts` + `domain/events/events.spec.ts`

## Phase 2: Application (TDD — test-first)

- [x] 2.1 `application/create-payroll-period.command.ts` + handler + spec
- [x] 2.2 `application/create-payroll-job.command.ts` + handler (transactional: aggregate + outbox + idempotency) + spec
- [x] 2.3 `application/queries/get-payroll-job.query.ts` + spec
- [x] 2.4 `application/queries/list-payroll-periods.query.ts` + spec
- [x] 2.5 `application/errors.ts` — application-level error classes

## Phase 3: Infrastructure

- [x] 3.1 `infrastructure/persistence/typeorm-payroll-period.entity.ts`
- [x] 3.2 `infrastructure/persistence/typeorm-payroll-job.entity.ts`
- [x] 3.3 `infrastructure/persistence/typeorm-idempotency.entity.ts`
- [x] 3.4 `infrastructure/persistence/typeorm-outbox.entity.ts`
- [x] 3.5 `infrastructure/persistence/typeorm-payroll-period.repository.ts` + spec
- [x] 3.6 `infrastructure/persistence/typeorm-payroll-job.repository.ts` + spec
- [x] 3.7 `infrastructure/persistence/typeorm-idempotency.repository.ts` + spec
- [x] 3.8 `infrastructure/persistence/typeorm-outbox.repository.ts` + spec
- [x] 3.9 `infrastructure/payroll.module.ts` — NestJS module with string-token DI

## Phase 4: Interface

- [x] 4.1 DTOs: create-period, create-job, period-response, job-response
- [x] 4.2 `interface/guards/idempotency.guard.ts` + spec (missing key, cache hit, hash mismatch)
- [x] 4.3 `interface/payroll.controller.ts` + spec (5 endpoints: POST periods, POST jobs, GET job, GET periods, GET job by company+period)

## Phase 5: Wiring

- [x] 5.1 `app.module.ts` — import PayrollModule, TypeOrmModule.forRoot, ConfigModule, handler providers
- [x] 5.2 `main.ts` — add Swagger docs at `/api`

## Phase 6: Verify

- [x] 6.1 `nx test payroll-service` — all tests pass (100/100, 16 suites)
- [x] 6.2 `nx build payroll-service` — clean build (0 errors)
- [x] 6.3 `nx lint payroll-service` — 0 errors (41 warnings, all pre-existing non-null assertions in test files)

## Phase 7: Roadmap

- [x] 7.1 Update `docs/09-tracking/implementation-roadmap.md` — mark Phase 7 complete
