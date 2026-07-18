# Proposal: Add Event Contracts

## Intent

Define typed event contracts for all bounded contexts beyond payroll. Without these, services cannot emit or consume cross-context events consistently — each team would invent their own envelope, making integration brittle and event-driven flows unreliable.

## Scope

### In Scope
- Identity event types: `UserRegistered`, `UserAuthenticated`, `PasswordChanged`, `UserDeactivated`
- Employee event types: `EmployeeCreated`, `EmployeeSalaryChanged`, `EmployeeTerminated`
- Notification event types: `NotificationRequested`, `EmailNotificationRequested`, `EmailSent`, `EmailFailed`
- Central event version registry (eventType → version number)
- Contract tests validating envelope shape, event type coverage, and version completeness

### Out of Scope
- Event payload schemas (defined by consuming services in their own specs)
- Shared-kernel event base classes (already exist)
- Infrastructure adapters (Kafka publisher, outbox writer)
- Audit event contracts (deferred to Phase 12)

## Capabilities

### New Capabilities
- `event-contracts`: Typed event type constants and event version registry shared across all bounded contexts. Defines the canonical set of events each domain can emit.

### Modified Capabilities
- None

## Approach

Extend `libs/contracts` with three new domain event files (`identity-events.ts`, `employee-events.ts`, `notification-events.ts`) mirroring the existing `payroll-events.ts` pattern. Add `event-versions.ts` as a `as const` registry mapping every event type to its version. Add contract tests in `libs/contracts/src/lib/` that validate envelope compliance at compile and runtime.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `libs/contracts/src/lib/identity-events.ts` | New | Identity domain event type constants |
| `libs/contracts/src/lib/employee-events.ts` | New | Employee domain event type constants |
| `libs/contracts/src/lib/notification-events.ts` | New | Notification domain event type constants |
| `libs/contracts/src/lib/event-versions.ts` | New | Central version registry for all events |
| `libs/contracts/src/index.ts` | Modified | Re-export new modules |
| `libs/contracts/src/lib/*.spec.ts` | New | Contract tests per domain module |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Event name collisions across contexts | Low | Namespaced by file — prefix not needed; review in spec phase |
| Version registry drifts from event types | Low | Contract test enforces every eventType has an entry |

## Rollback Plan

Revert the commit: delete new files and restore `index.ts` to prior state. All existing code (payroll events, publishers) is untouched.

## Dependencies

- `libs/contracts` must be buildable (confirmed: 12/12 projects build)
- Existing `EventEnvelope` interface and `PayrollEventType` pattern

## Success Criteria

- [ ] 3 new event type modules compile with zero NestJS or infra imports
- [ ] Version registry covers every event type (payroll + identity + employee + notification)
- [ ] All tests pass: `nx test contracts`
- [ ] Existing payroll-event consumers unchanged
