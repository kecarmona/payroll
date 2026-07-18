# Proposal: Add Employee Service

## Intent

Add the employee bounded context — manage employee lifecycle (creation, personal/positional data changes, salary changes, termination). Consumes `UserRegistered` events from auth-service. Provides the employee data and salary reference that downstream payroll services depend on.

## Scope

### In Scope
- `Employee` aggregate (name, position, salary as `Money`, companyId, employment status, optimistic lock)
- Create, update personal data, change salary, terminate commands/handlers
- `EmployeeController` — `POST /employees`, `PATCH /:id`, `PATCH /:id/salary`, `POST /:id/terminate`
- `UserRegistered` event consumer (provisions employee record from auth new-user event)
- TypeORM PostgreSQL repositories + migration
- String-token DI for domain port implementations
- `EmployeeUpdated` event added to `libs/contracts` (new — currently missing)
- Unit tests (domain rules, value objects), integration tests (repository)

### Out of Scope
- Transactional outbox integration (deferred to Phase 8)
- Kafka publishing (deferred to Phase 8)
- Read-side projections (deferred to Phase 10)
- Idempotency-Key support (deferred to hardening)
- Bulk operations, CSV import/export

## Capabilities

### New Capabilities
- `employee-service`: Employee lifecycle management — create, update, salary change, termination, and UserRegistered consumption

### Modified Capabilities
- `event-contracts`: Add `EmployeeUpdated` event type (3→4 employee events, 20→21 total)

## Approach

Clean Architecture mirroring auth-service:

1. **Domain** (`domain/`): `Employee` aggregate extends `AggregateRoot`; value objects `EmployeeId`, `EmployeeName`, `EmployeePosition`; `EmploymentStatus` enum (`Active`, `Terminated`); salary as `Money` from shared-kernel; domain events `EmployeeCreated`, `EmployeeUpdated` (new), `EmployeeSalaryChanged`, `EmployeeTerminated`; `EmployeeRepository` port.
2. **Application** (`application/`): Commands — `CreateEmployeeCommand`, `UpdateEmployeeDataCommand`, `ChangeSalaryCommand`, `TerminateEmployeeCommand`; `UserRegisteredConsumer` maps auth user to employee record via domain service.
3. **Interface** (`interface/`): `EmployeeController`, DTOs with class-validator, `EventPublisher` port (logged — outbox deferred).
4. **Infrastructure** (`infrastructure/`): `TypeormEmployeeRepository`, PostgreSQL entity + migration; logger-based `ConsoleEventPublisher`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `apps/employee-service/src/domain/` | New | Aggregate, VOs, events, repository port |
| `apps/employee-service/src/application/` | New | Commands, handlers, event consumer |
| `apps/employee-service/src/interface/` | New | Controller, DTOs |
| `apps/employee-service/src/infrastructure/` | New | Repository, migration, event publisher |
| `libs/contracts/src/lib/employee-events.ts` | Modified | Add `EmployeeUpdated` constant |
| `libs/contracts/src/lib/employee-events.spec.ts` | Modified | 3→4 entries |
| `libs/contracts/src/lib/event-versions.ts` | Modified | Add `EmployeeUpdated: 1` |
| `libs/contracts/src/lib/event-versions.spec.ts` | Modified | 20→21 total |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Contract test count assertions break | Low | Update lockstep with event addition |
| Salary precision from floating-point | Low | `Money` from shared-kernel enforces integer cents |
| Missing `EmployeeUpdated` blocks consumers | Med | Add to contracts before service implementation |

## Rollback Plan

Revert migration (`DROP TABLE employees CASCADE`), remove employee-service module from infra compose, restore git state. Revert contracts changes. No downstream dependents yet.

## Dependencies

- Phases 0–5 (monorepo, shared-kernel, contracts, event-bus, service-foundation, auth-service)
- `libs/shared-kernel` (AggregateRoot, Id, Money, DomainError)
- `libs/contracts` (EmployeeEventType, EventEnvelope)
- `libs/service-foundation` (ConfigModule, ValidationPipe, ExceptionFilter)
- `@nestjs/typeorm`, `typeorm`, `pg`

## Success Criteria

- [ ] `POST /employees` creates employee with salary in cents, returns 201
- [ ] `PATCH /employees/:id` updates personal/positional data
- [ ] `PATCH /employees/:id/salary` changes salary, records `EmployeeSalaryChanged`
- [ ] `POST /employees/:id/terminate` sets `EmploymentStatus.Terminated`
- [ ] `UserRegistered` event provisions employee record
- [ ] Contract tests pass — 4 employee event types, 21 total versions
- [ ] Domain tests pass — salary invariants, status transitions, name validation
- [ ] Integration tests pass — repository CRUD against PostgreSQL
