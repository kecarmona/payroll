# Tasks: Add Event Contracts

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 200–350 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Source Files (TDD — test first each)

- [x] 1.1 Create `libs/contracts/src/lib/event-versions.ts` — version registry with compile-time `satisfies` coverage constraint
- [x] 1.2 Create `libs/contracts/src/lib/event-versions.spec.ts` — validate all 20 events have version entries
- [x] 1.3 Create `libs/contracts/src/lib/identity-events.ts` — 4 event constants (UserRegistered, UserAuthenticated, PasswordChanged, UserDeactivated) + derived union
- [x] 1.4 Create `libs/contracts/src/lib/identity-events.spec.ts` — validate constants match keys, type rejects unknown strings
- [x] 1.5 Create `libs/contracts/src/lib/employee-events.ts` — 3 event constants (EmployeeCreated, EmployeeSalaryChanged, EmployeeTerminated) + derived union
- [x] 1.6 Create `libs/contracts/src/lib/employee-events.spec.ts` — validate constants match keys, type rejects unknown strings
- [x] 1.7 Create `libs/contracts/src/lib/notification-events.ts` — 4 notification event constants + derived union
- [x] 1.8 Create `libs/contracts/src/lib/notification-events.spec.ts` — validate constants match keys
- [x] 1.9 Create `libs/contracts/src/lib/event-envelope.spec.ts` — validate envelope field types and shape
- [x] 1.10 Update `libs/contracts/src/index.ts` — add re-exports for identity-events, employee-events, notification-events, event-versions

## Phase 2: Verify

- [x] 2.1 Run `nx test contracts` — all tests pass
- [x] 2.2 Run `nx build contracts` — builds cleanly
- [x] 2.3 Run `nx lint contracts` — passes

## Phase 3: Roadmap

- [x] 3.1 Update `docs/09-tracking/implementation-roadmap.md` — mark identity, employee, notification event contracts + version constants + contract tests as done

### Test-First Execution Order

1. `event-versions` (foundation — other tests depend on version constants)
2. `identity-events`
3. `employee-events`
4. `notification-events`
5. `event-envelope.spec.ts` (validates all types work together)
