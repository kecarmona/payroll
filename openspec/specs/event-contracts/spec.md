# Event Contracts Specification

## Purpose

Typed event type constants and a centralized event version registry shared across all bounded contexts. Defines the canonical set of domain events that services can emit and consume, ensuring consistent event-driven integration without brittle string literals.

## Requirements

### R1: Identity Event Contracts Define Canonical Event Types

The `identity-events.ts` module MUST define const entries and a derived union type for UserRegistered, UserAuthenticated, PasswordChanged, and UserDeactivated, following the `PayrollEventType` pattern.

- GIVEN no prior identity event types
- WHEN importing `IdentityEventType` from `identity-events.ts`
- THEN it MUST contain entries for `UserRegistered`, `UserAuthenticated`, `PasswordChanged`, and `UserDeactivated`
- AND each entry's value MUST equal its key string

- GIVEN the `IdentityEventType` type alias
- WHEN used as a type annotation
- THEN it MUST accept only the four defined event type string literals

### R2: Employee Event Contracts Define Canonical Event Types

The `employee-events.ts` module MUST define const entries and a derived union type for EmployeeCreated, EmployeeUpdated, EmployeeSalaryChanged, and EmployeeTerminated, following the same pattern.

- GIVEN no prior employee event types
- WHEN importing `EmployeeEventType` from `employee-events.ts`
- THEN it MUST contain entries for `EmployeeCreated`, `EmployeeUpdated`, `EmployeeSalaryChanged`, and `EmployeeTerminated`
- AND each entry's value MUST equal its key string

- GIVEN an unknown event type string
- WHEN assigned to an `EmployeeEventType` variable
- THEN TypeScript MUST produce a compile-time error

### R3: Notification Event Contracts Define Canonical Event Types

The `notification-events.ts` module MUST define const entries and a derived union type for NotificationRequested, EmailNotificationRequested, EmailSent, and EmailFailed.

- GIVEN no prior notification event types
- WHEN importing `NotificationEventType` from `notification-events.ts`
- THEN it MUST contain entries for `NotificationRequested`, `EmailNotificationRequested`, `EmailSent`, and `EmailFailed`

- GIVEN the notification event const object
- WHEN accessing a key
- THEN the value MUST be the same string as the key

### R4: Event Version Registry Covers All Event Types

The `event-versions.ts` module MUST export a const record mapping every event type string to its current version number. The record MUST cover all 21 event types from payroll, identity, employee, and notification domains. The type MUST enforce that every event type key is present.

- GIVEN the payroll domain
- WHEN inspecting `EVENT_VERSIONS`
- THEN all 9 payroll event types from `PayrollEventType` MUST have an entry

- GIVEN the identity domain
- WHEN inspecting `EVENT_VERSIONS`
- THEN all 4 identity event types from `IdentityEventType` MUST have an entry

- GIVEN the employee domain
- WHEN inspecting `EVENT_VERSIONS`
- THEN all 4 employee event types from `EmployeeEventType` MUST have an entry

- GIVEN the notification domain
- WHEN inspecting `EVENT_VERSIONS`
- THEN all 4 notification event types from `NotificationEventType` MUST have an entry

- GIVEN a new event type added to one of the domain modules
- WHEN the `EVENT_VERSIONS` record is not updated
- THEN a TypeScript compile-time error MUST occur

### R5: Contract Tests Validate Envelope Shape and Coverage

Contract tests MUST validate that `EventEnvelope` contains all required fields, that every event type constant has a version registry entry, and that the version registry keys match known event types at compile time.

- GIVEN an `EventEnvelope` instance
- WHEN constructed with all required fields
- THEN each field MUST have the correct type: `eventId` (string), `eventType` (string), `version` (number), `timestamp` (string), `companyId` (string), `correlationId` (string), `causationId` (string), `producer` (string), `payload` (unknown)

- GIVEN the combined set of all event type constants
- WHEN checked against `EVENT_VERSIONS`
- THEN every event type MUST have a corresponding version entry

- GIVEN the type-level version registry constraint
- WHEN the `EVENT_VERSIONS` type is evaluated
- THEN it MUST reject any record missing one or more known event type keys
