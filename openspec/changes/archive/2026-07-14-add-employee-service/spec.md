# Employee Service Specification

## Purpose

Employee bounded context — manage employee lifecycle (creation, data/position updates, salary changes, termination) and consume `UserRegistered` events from auth-service. Provides the employee data and salary reference that downstream payroll services depend on.

---

## Employee Service — Requirements

### R1: Create Employee

The system MUST accept `companyId`, `name`, `position`, and `salary` (integer cents + ISO 4217 currency). On success it MUST return the `EmployeeId` and record an `EmployeeCreated` domain event. An active Employee record SHALL be auto-provisioned from `UserRegistered`.

- GIVEN valid name, position, and salary in cents with a valid currency
- WHEN the `CreateEmployee` command is executed
- THEN an Employee is created with status `Active`
- AND an `EmployeeCreated` event is recorded
- AND the `EmployeeId` is returned

- GIVEN a salary with negative cents
- WHEN the `CreateEmployee` command is executed
- THEN a `ValidationError` MUST be thrown

- GIVEN an empty name string
- WHEN the `CreateEmployee` command is executed
- THEN a `ValidationError` MUST be thrown

### R2: Update Employee Data

The system MUST accept `name` and/or `position` changes. Empty strings MUST be rejected. An `EmployeeUpdated` domain event MUST be recorded with the list of changed field names.

- GIVEN an active employee
- WHEN the `UpdateEmployeeData` command changes the name and position
- THEN the employee's name and position are updated
- AND an `EmployeeUpdated` event is recorded
- AND the event payload contains `changedFields: ['name', 'position']`

- GIVEN an active employee
- WHEN the `UpdateEmployeeData` command is called with an empty name
- THEN a `ValidationError` MUST be thrown

- GIVEN a terminated employee
- WHEN the `UpdateEmployeeData` command is executed
- THEN a `DomainError` MUST be thrown (terminated employees are immutable)

### R3: Change Employee Salary

The system MUST accept a new salary amount in cents and currency. The `Money` value object from shared-kernel SHALL enforce non-negative cents and valid ISO 4217 currency. An `EmployeeSalaryChanged` domain event MUST be recorded. The aggregate version MUST increment on change.

- GIVEN an active employee with a current salary of 3000000 cents ARS
- WHEN the `ChangeSalary` command sets salary to 3500000 cents ARS
- THEN the employee's salary is updated to 3500000 ARS
- AND an `EmployeeSalaryChanged` event is recorded
- AND the aggregate version is incremented

- GIVEN an active employee
- WHEN the `ChangeSalary` command is called with a negative amount
- THEN a `ValidationError` MUST be thrown

- GIVEN a terminated employee
- WHEN the `ChangeSalary` command is executed
- THEN a `DomainError` MUST be thrown

### R4: Terminate Employee

The system MUST set employment status to `Terminated`. A terminated employee MUST NOT accept further mutations. Re-terminating SHALL be idempotent. An `EmployeeTerminated` domain event MUST be recorded. The system MUST return the termination timestamp.

- GIVEN an active employee
- WHEN the `TerminateEmployee` command is executed
- THEN the employee's status is set to `Terminated`
- AND an `EmployeeTerminated` event is recorded
- AND a termination timestamp is returned

- GIVEN an already terminated employee
- WHEN the `TerminateEmployee` command is executed
- THEN the operation is idempotent (no new event recorded)

### R5: Consume UserRegistered from Auth Service

The system MUST listen to `UserRegistered` events and provision an Employee record using the user's `userId` as `EmployeeId` and `companyId`. Duplicate events SHALL be idempotent (keyed by userId + companyId). Missing fields MUST be logged and skipped.

- GIVEN a valid `UserRegistered` event with userId and companyId
- WHEN the event consumer processes it
- THEN an Employee record is provisioned with status `Active`
- AND the employee name defaults to the user's email prefix

- GIVEN a duplicate `UserRegistered` event (same userId + companyId)
- WHEN the event consumer processes it
- THEN the operation is idempotent — no duplicate employee is created

---

## Event Contracts — Modified Capability

### ADDED Requirements

#### EmployeeUpdated Event Type

The `employee-events.ts` module MUST add `EmployeeUpdated: 'EmployeeUpdated'` to the `EmployeeEventType` const object. The `employee-events.spec.ts` test MUST assert 4 entries instead of 3.

- GIVEN the existing `EmployeeEventType` with 3 entries
- WHEN `EmployeeUpdated` is added
- THEN the const object contains 4 entries: `EmployeeCreated`, `EmployeeUpdated`, `EmployeeSalaryChanged`, `EmployeeTerminated`

- GIVEN the `EmployeeEventType` type alias
- WHEN a string literal `'EmployeeUpdated'` is used
- THEN TypeScript accepts it as a valid member of the union

#### EmployeeUpdated Version Registry Entry

The `event-versions.ts` module MUST add `EmployeeUpdated: 1` to `EVENT_VERSIONS`. The `event-versions.spec.ts` MUST assert 21 total entries instead of 20.

- GIVEN the `EVENT_VERSIONS` record with 20 entries
- WHEN `EmployeeUpdated: 1` is added under the Employee section
- THEN the record contains exactly 21 entries

- GIVEN the `satisfies Record<AllEventTypes, number>` constraint
- WHEN `EmployeeUpdated` is added to `EmployeeEventType` but NOT to `EVENT_VERSIONS`
- THEN TypeScript produces a compile-time error

### REMOVED Requirements

None.

### MODIFIED Requirements

#### R2 from event-contracts/spec.md — Employee Event Contracts Define Canonical Event Types

The `employee-events.ts` module MUST define const entries and a derived union type for EmployeeCreated, EmployeeUpdated (new), EmployeeSalaryChanged, and EmployeeTerminated, following the same pattern.
(Previously: defined 3 entries — EmployeeCreated, EmployeeSalaryChanged, EmployeeTerminated)

- GIVEN no prior employee event types
- WHEN importing `EmployeeEventType` from `employee-events.ts`
- THEN it MUST contain entries for `EmployeeCreated`, `EmployeeUpdated`, `EmployeeSalaryChanged`, and `EmployeeTerminated`
- AND each entry's value MUST equal its key string

#### R4 from event-contracts/spec.md — Event Version Registry Covers All Event Types

The `event-versions.ts` module MUST export a const record mapping every event type string to its current version number. The record MUST cover all 21 event types from payroll, identity, employee, and notification domains.
(Previously: covered 20 event types — 3 employee events)

- GIVEN the employee domain
- WHEN inspecting `EVENT_VERSIONS`
- THEN all 4 employee event types from `EmployeeEventType` MUST have an entry
