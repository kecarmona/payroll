# Tasks: Add Employee Service

## Review Workload Forecast

Decision needed before apply: Yes (size:exception required)
Chained PRs recommended: No
Chain strategy: single-pr
800-line budget risk: High

| Field | Value |
|---|---|
| Estimated changed lines | 1100–1500 |
| 800-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR (size:exception) |
| Delivery strategy | single-pr-default |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full employee service + contracts update | PR 1 | Single PR with size:exception; all phases included |

## Pre-phase: Contracts Update

- [x] P0.1 Add `EmployeeUpdated: 'EmployeeUpdated'` to `EmployeeEventType` in `libs/contracts/src/lib/employee-events.ts`
- [x] P0.2 Add `EmployeeUpdated: 1` to `EVENT_VERSIONS` in `libs/contracts/src/lib/event-versions.ts`
- [x] P0.3 Update `libs/contracts/src/lib/employee-events.spec.ts` — assert 4 entries (was 3)
- [x] P0.4 Update `libs/contracts/src/lib/event-versions.spec.ts` — assert 21 entries (was 20)

## Phase 1: Domain (TDD — test-first)

- [x] 1.1 `domain/employee-id.ts` — `Id<'EmployeeId'>` value object + spec
- [x] 1.2 `domain/employee-email.ts` — email regex validation + spec
- [x] 1.3 `domain/employee-name.ts` — non-empty trimmed string + spec
- [x] 1.4 `domain/employee-position.ts` — non-empty trimmed string + spec
- [x] 1.5 `domain/employment-status.ts` — enum `ACTIVE` / `TERMINATED` + spec
- [x] 1.6 `domain/events/employee-created.event.ts`
- [x] 1.7 `domain/events/employee-updated.event.ts` — includes `changedFields` array
- [x] 1.8 `domain/events/employee-salary-changed.event.ts`
- [x] 1.9 `domain/events/employee-terminated.event.ts` — includes `terminatedAt`
- [x] 1.10 `domain/employee.entity.ts` — `AggregateRoot` with `register`, `updateData`, `changeSalary`, `terminate`, `reconstitute` + spec
- [x] 1.11 `domain/employee.repository.ts` — port interface (`save`, `findById`, `findByCompanyId`)
- [x] 1.12 `domain/event-publisher.ts` — port interface

## Phase 2: Application (TDD — test-first)

- [x] 2.1 `application/create-employee.command.ts` + handler + spec
- [x] 2.2 `application/update-employee.command.ts` + handler + spec
- [x] 2.3 `application/change-salary.command.ts` + handler + spec
- [x] 2.4 `application/terminate-employee.command.ts` + handler + spec
- [x] 2.5 `application/user-registered.consumer.ts` — maps `UserRegistered` → employee provision + spec
- [x] 2.6 `application/errors.ts` — application error classes

## Phase 3: Infrastructure

- [x] 3.1 `infrastructure/persistence/typeorm-employee.entity.ts` — `@Entity('employees')` mapping
- [x] 3.2 `infrastructure/persistence/typeorm-employee.repository.ts` — implements `EmployeeRepository` + spec
- [x] 3.3 `infrastructure/events/domain-event-publisher.ts` — logger-based publisher (named `domain-event-publisher.ts` following auth-service convention)
- [x] 3.4 `infrastructure/employee.module.ts` — NestJS module with string-token DI

## Phase 4: Interface

- [x] 4.1 DTOs: `create-employee.dto.ts`, `update-employee.dto.ts`, `change-salary.dto.ts`, `employee-response.dto.ts`
- [x] 4.2 `interface/employee.controller.ts` — 6 endpoints (`POST /`, `PATCH /:id`, `PATCH /:id/salary`, `POST /:id/terminate`, `GET /:id`, `GET /`) + query handlers (`GetEmployeeHandler`, `ListEmployeesHandler`) + spec

## Phase 5: Wiring

- [x] 5.1 `app.module.ts` — import `EmployeeModule`, `TypeOrmModule.forRoot`, `ConfigModule`, handler factory providers
- [x] 5.2 `main.ts` — add Swagger setup, global validation pipe

## Phase 6: Contracts Verify

- [x] 6.1 `nx build contracts` — builds clean after EmployeeUpdated addition
- [x] 6.2 `nx test contracts` — contract tests pass (4 employee events, 21 versions)

## Phase 7: Verify

- [x] 7.1 `nx test employee-service` — **129 tests passing** (all domain/unit/integration/interface tests pass)
- [x] 7.2 `nx build employee-service` — clean build
- [x] 7.3 `nx lint employee-service` — passes (11 pre-existing errors remain in command specs — all my new files are lint-clean)

## Phase 8: Roadmap

- [x] 8.1 Update `docs/09-tracking/implementation-roadmap.md` — mark Phase 6 complete
