# Design: Add Employee Service

## Technical Approach

Clean Architecture employee service mirroring auth-service patterns. `Employee` aggregate manages lifecycle with 4 explicit state transitions, each recording a domain event. TypeORM persistence, logger-based event publisher, string-token DI wiring. Contracts update adds `EmployeeUpdated` event type.

## Architecture Decisions

### Decision: Single aggregate for Employee

| Option | Tradeoff | Decision |
|--------|----------|----------|
| CQRS aggregates (write vs read) | Premature — no write-path scaling need yet | ❌ |
| Single `Employee` aggregate | Matches auth `User` pattern; employee < 10 fields; version-locked consistency | ✅ |
| Embedded salary in Employee | Salary is integral to the aggregate (payroll references both); separate aggregate would require cross-aggregate consistency | ✅ |

### Decision: Optional email on Employee aggregate

Email comes from `UserRegistered` provisioning only. Direct API creation (R1) doesn't require it — the consumer sets it later. Kept as nullable column.

### Decision: EmployeeName / EmployeePosition as value objects

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Raw strings | Can't enforce invariants at domain boundary | ❌ |
| Value objects | Zero-cost type safety; validation at construction; mirrors `UserEmail` pattern | ✅ |

## Data Flow

```
POST /employees
  Controller → CreateEmployeeHandler
    → Employee.register(id, name, position, salary, companyId)
    → EmployeeRepository.save(employee)
    → EventPublisher.publish(EmployeeCreated)

PATCH /employees/:id
  Controller → UpdateEmployeeHandler
    → EmployeeRepository.findById(id)
    → employee.updateData(name?, position?)
    → EmployeeRepository.save(employee)  [version check]
    → EventPublisher.publish(EmployeeUpdated)  [changedFields]

PATCH /employees/:id/salary
  Controller → ChangeSalaryHandler
    → EmployeeRepository.findById(id)
    → employee.changeSalary(new Money(amount, currency))
    → EmployeeRepository.save(employee)  [version check]
    → EventPublisher.publish(EmployeeSalaryChanged)

POST /employees/:id/terminate
  Controller → TerminateEmployeeHandler
    → EmployeeRepository.findById(id)
    → employee.terminate()  [idempotent]
    → EmployeeRepository.save(employee)
    → EventPublisher.publish(EmployeeTerminated)

UserRegistered (event) → UserRegisteredConsumer
    → EmployeeId = event.userId
    → Employee.register(id, name=emailPrefix, companyId, salary=0)
    → EmployeeRepository.save(employee)
    [idempotent: findById first → skip if exists]
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `apps/employee-service/src/domain/employee-id.ts` | Create | Extends `Id<'EmployeeId'>` |
| `apps/employee-service/src/domain/employee-email.ts` | Create | ValueObject with email regex |
| `apps/employee-service/src/domain/employee-name.ts` | Create | ValueObject — non-empty, trimmed |
| `apps/employee-service/src/domain/employee-position.ts` | Create | ValueObject — non-empty, trimmed |
| `apps/employee-service/src/domain/employment-status.ts` | Create | Enum ACTIVE/TERMINATED |
| `apps/employee-service/src/domain/employee.entity.ts` | Create | AggregateRoot + factory/business methods |
| `apps/employee-service/src/domain/employee.repository.ts` | Create | Port: save, findById, findByCompanyId |
| `apps/employee-service/src/domain/event-publisher.ts` | Create | Same port as auth-service |
| `apps/employee-service/src/domain/events/employee-created.event.ts` | Create | DomainEvent impl |
| `apps/employee-service/src/domain/events/employee-updated.event.ts` | Create | +changedFields[] |
| `apps/employee-service/src/domain/events/employee-salary-changed.event.ts` | Create | DomainEvent impl |
| `apps/employee-service/src/domain/events/employee-terminated.event.ts` | Create | +terminatedAt |
| `apps/employee-service/src/application/create-employee.command.ts` | Create | Command + handler |
| `apps/employee-service/src/application/update-employee.command.ts` | Create | Command + handler |
| `apps/employee-service/src/application/change-salary.command.ts` | Create | Command + handler |
| `apps/employee-service/src/application/terminate-employee.command.ts` | Create | Command + handler |
| `apps/employee-service/src/application/user-registered.consumer.ts` | Create | Auto-provision from auth event |
| `apps/employee-service/src/interface/employee.controller.ts` | Create | REST controller, 6 endpoints |
| `apps/employee-service/src/interface/dto/create-employee.dto.ts` | Create | class-validator |
| `apps/employee-service/src/interface/dto/update-employee.dto.ts` | Create | Partial name/position |
| `apps/employee-service/src/interface/dto/change-salary.dto.ts` | Create | amountCents + currency |
| `apps/employee-service/src/interface/dto/employee-response.dto.ts` | Create | Swagger response type |
| `apps/employee-service/src/infrastructure/employee.module.ts` | Create | NestJS module with string-token DI |
| `apps/employee-service/src/infrastructure/persistence/typeorm-employee.entity.ts` | Create | `employees` table mapping |
| `apps/employee-service/src/infrastructure/persistence/typeorm-employee.repository.ts` | Create | Implements EmployeeRepository |
| `apps/employee-service/src/infrastructure/events/console-event-publisher.ts` | Create | Logger-based (outbox deferred) |
| `apps/employee-service/src/app.module.ts` | Modify | Import EmployeeModule + TypeORM + Config |
| `apps/employee-service/src/main.ts` | Modify | Add Swagger + GlobalExceptionFilter |
| `libs/contracts/src/lib/employee-events.ts` | Modify | Add `EmployeeUpdated` constant (3→4) |
| `libs/contracts/src/lib/employee-events.spec.ts` | Modify | Assert 4 entries |
| `libs/contracts/src/lib/event-versions.ts` | Modify | Add `EmployeeUpdated: 1` (20→21) |
| `libs/contracts/src/lib/event-versions.spec.ts` | Modify | Assert 21 entries |

## Interfaces / Contracts

```typescript
// Domain event payloads
interface EmployeeCreatedPayload {
  employeeId: string;
  companyId: string;
  name: string;
  position: string;
  salaryAmountCents: number;
  salaryCurrency: string;
}

interface EmployeeUpdatedPayload {
  employeeId: string;
  companyId: string;
  changedFields: string[];
  name?: string;
  position?: string;
}

interface EmployeeSalaryChangedPayload {
  employeeId: string;
  companyId: string;
  previousAmountCents: number;
  previousCurrency: string;
  newAmountCents: number;
  newCurrency: string;
}

interface EmployeeTerminatedPayload {
  employeeId: string;
  companyId: string;
  terminatedAt: string;
}

// Repository port
interface EmployeeRepository {
  save(employee: Employee): Promise<void>;
  findById(id: EmployeeId): Promise<Employee | null>;
  findByCompanyId(companyId: string): Promise<Employee[]>;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Employee aggregate (register, updateData, changeSalary, terminate, invariants, idempotency) | Pure domain, no infra |
| Unit | Value objects (EmployeeEmail, EmployeeName validation) | Constructor invariants |
| Unit | Command handlers (mock repository + publisher) | Mock domain ports |
| Unit | EmploymentStatus transitions (ACTIVE↔TERMINATED) | Enum guards |
| Integration | TypeORM repository (CRUD, optimistic locking) | Testcontainers PostgreSQL |
| Contract | Employee events count (3→4), versions (20→21) | Direct assertion |

## Migration / Rollout

```sql
CREATE TABLE employees (
  id VARCHAR(255) PRIMARY KEY,
  company_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  salary_amount_cents INTEGER NOT NULL,
  salary_currency VARCHAR(3) NOT NULL,
  department VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employees_company_id ON employees(company_id);
```

## Employee Aggregate Design

```typescript
class Employee extends AggregateRoot<string> {
  private _email: EmployeeEmail | null;
  private _name: EmployeeName;
  private _position: EmployeePosition;
  private _salary: Money;
  private _department: string | null;
  private _status: EmploymentStatus;

  static register(id: EmployeeId, name: EmployeeName, position: EmployeePosition,
    salary: Money, companyId: string): Employee { /* records EmployeeCreated */ }
  static reconstitute(props: { ... }): Employee { /* bypasses register */ }
  updateData(name?: EmployeeName, position?: EmployeePosition, department?: string): void { /* guards terminated; records EmployeeUpdated */ }
  changeSalary(newSalary: Money): void { /* guards terminated; records EmployeeSalaryChanged */ }
  terminate(): void { /* idempotent; records EmployeeTerminated */ }
}
```

## DI Wiring

```typescript
// employee.module.ts
export const EMPLOYEE_REPOSITORY_TOKEN = 'EmployeeRepository';
export const EVENT_PUBLISHER_TOKEN = 'EventPublisher';

@Module({
  imports: [TypeOrmModule.forFeature([TypeOrmEmployeeEntity])],
  providers: [
    { provide: EMPLOYEE_REPOSITORY_TOKEN, useClass: TypeOrmEmployeeRepository },
    { provide: EVENT_PUBLISHER_TOKEN, useClass: ConsoleEventPublisher },
  ],
  exports: [EMPLOYEE_REPOSITORY_TOKEN, EVENT_PUBLISHER_TOKEN],
})
export class EmployeeModule {}
```

Handlers wired as `useFactory` in `AppModule` (matching auth-service pattern), injecting `@Inject(EMPLOYEE_REPOSITORY_TOKEN)` and `@Inject(EVENT_PUBLISHER_TOKEN)`.

## Open Questions

- [ ] None
