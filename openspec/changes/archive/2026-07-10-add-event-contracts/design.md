# Design: Add Event Contracts

## Technical Approach

Extend `libs/contracts` with three new domain event type modules mirroring the existing `payroll-events.ts` pattern (const map + derived union type). Add a central event version registry with a type-level constraint enforcing full coverage. Add contract tests validating envelope shape and registry completeness.

The `EventEnvelope` interface and `PayrollEventType` are unchanged — zero refactor risk to existing consumers.

## Architecture Decisions

### Decision: Standalone files per domain vs. single monolith

| Option | Tradeoff | Decision |
|--------|----------|----------|
| One file per domain (identity, employee, notification) | Clearer ownership, avoids merge conflicts, mirrors existing `payroll-events.ts` | ✅ **Chosen** |
| Single `all-events.ts` | Simpler imports but couples unrelated domains and creates merge contention | ❌ Rejected |

**Rationale**: The project already has `payroll-events.ts` as a precedent. Keeping each domain in its own file lets services import only what they need and prevents a single-file bottleneck as more domains are added.

### Decision: Version registry type safety via `satisfies`

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `as const satisfies Record<AllEventTypes, number>` | Compile-time error if a key is missing — zero runtime cost | ✅ **Chosen** |
| Manual `Record<string, number>` | No type-level enforcement, drift goes undetected until runtime | ❌ Rejected |
| Zod schema validation | Runtime validation adds dependency, overkill for const maps | ❌ Rejected |

**Rationale**: The spec requires that adding a new event type without updating the version registry causes a compile-time error. `satisfies` with a mapped type union of all event types achieves this with zero runtime overhead.

### Decision: Contract tests in `lib/` (co-located) vs. separate `test/` dir

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `.spec.ts` co-located with source files | Jest default glob `**/*.spec.ts` already picks them up. Keeps contract tests next to their contracts. | ✅ **Chosen** |
| Separate `test/` dir | Adds nesting, adds no benefit when there are no infra dependencies to mock | ❌ Rejected |

**Rationale**: These are pure-type contract tests with zero infrastructure. Co-location is simpler and follows the existing project pattern (no other `test/` dirs exist in `libs/contracts`).

## Data Flow

```
libs/contracts/src/lib/
  │
  ├── event-envelope.ts  (interface — unchanged, +JSDoc)
  ├── payroll-events.ts   (const map — unchanged, +JSDoc)
  │
  ├── identity-events.ts       (NEW) ──┐
  ├── employee-events.ts       (NEW) ──┤
  ├── notification-events.ts   (NEW) ──┤
  └── event-versions.ts        (NEW) ──┘
              │
              ▼
libs/contracts/src/index.ts (re-exports all)
              │
              ▼
       Services import EventType + version
       from @payroll/contracts
```

No runtime data flows — these are pure type-and-const exports consumed at compile time.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `libs/contracts/src/lib/identity-events.ts` | Create | 4 identity event type constants + derived union |
| `libs/contracts/src/lib/employee-events.ts` | Create | 3 employee event type constants + derived union |
| `libs/contracts/src/lib/notification-events.ts` | Create | 4 notification event type constants + derived union |
| `libs/contracts/src/lib/event-versions.ts` | Create | Version registry (all 20 events) with compile-time coverage constraint |
| `libs/contracts/src/lib/event-envelope.ts` | Modify | Add JSDoc to existing interface |
| `libs/contracts/src/lib/payroll-events.ts` | Modify | Add JSDoc to existing const/type |
| `libs/contracts/src/index.ts` | Modify | Add re-exports for all new modules |
| `libs/contracts/src/lib/event-envelope.spec.ts` | Create | Validate envelope shape and field types |
| `libs/contracts/src/lib/event-versions.spec.ts` | Create | Validate all 20 events have version entries |

## Interfaces / Contracts

**Event type file pattern** (e.g. `identity-events.ts`):

```ts
export const IdentityEventType = {
  UserRegistered: 'UserRegistered',
  UserAuthenticated: 'UserAuthenticated',
  PasswordChanged: 'PasswordChanged',
  UserDeactivated: 'UserDeactivated',
} as const;

export type IdentityEventType = (typeof IdentityEventType)[keyof typeof IdentityEventType];
```

**Event versions** (`event-versions.ts`):

```ts
export const EVENT_VERSIONS = {
  // Payroll (9)
  PayrollJobCreated: 1,
  PayrollJobProcessingStarted: 1,
  PayrollTransactionCreated: 1,
  PayrollTransactionProcessingStarted: 1,
  PayrollTransactionCompleted: 1,
  PayrollTransactionFailed: 1,
  PayrollJobCompleted: 1,
  PayrollJobFailed: 1,
  PayslipGenerated: 1,
  // Identity (4)
  UserRegistered: 1,
  UserAuthenticated: 1,
  PasswordChanged: 1,
  UserDeactivated: 1,
  // Employee (3)
  EmployeeCreated: 1,
  EmployeeSalaryChanged: 1,
  EmployeeTerminated: 1,
  // Notification (4)
  NotificationRequested: 1,
  EmailNotificationRequested: 1,
  EmailSent: 1,
  EmailFailed: 1,
} as const satisfies Record<
  | (typeof PayrollEventType)[keyof typeof PayrollEventType]
  | (typeof IdentityEventType)[keyof typeof IdentityEventType]
  | (typeof EmployeeEventType)[keyof typeof EmployeeEventType]
  | (typeof NotificationEventType)[keyof typeof NotificationEventType],
  number
>;
```

**Index exports** (`index.ts`):

```ts
export * from './lib/event-envelope';
export * from './lib/payroll-events';
export * from './lib/identity-events';
export * from './lib/employee-events';
export * from './lib/notification-events';
export * from './lib/event-versions';
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Contract | `EventEnvelope` field types | Instantiate an envelope, assert each field type via `expect(typeof ...).toBe(...)` |
| Contract | Version registry coverage | Iterate all event type const values, assert `EVENT_VERSIONS` has a numeric entry for each |
| Type-level | Registry completeness | Compile-time: `satisfies` clause rejects missing keys. Runtime: spec test confirms no gaps. |

No mocking needed — contracts are pure TypeScript with zero infrastructure dependencies.

## Migration / Rollout

No migration required. Existing `payroll-events.ts` and `event-envelope.ts` are unchanged — adding exports is additive. Services consuming `@payroll/contracts` will pick up new exports on next build without any code changes.

## Open Questions

- None
