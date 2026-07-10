# Tasks: Add Shared Kernel

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350-450 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Test-First — Value Objects & Errors

- [x] 1.1 Write `id.spec.ts` + implement `id.ts` — generic Id\<T\>, non-empty guard, UUID generation, equality
- [x] 1.2 Write `company-id.spec.ts` + implement `company-id.ts` — `create()`, `from()`, branded CompanyId type
- [x] 1.3 Write `money.spec.ts` + implement `money.ts` — integer cents, ISO 4217 validation, add/subtract with currency guard
- [x] 1.4 Write `domain-error.spec.ts` + implement `domain-error.ts` — abstract DomainError, ValidationError, NotFoundError

## Phase 2: Test-First — AggregateRoot

- [x] 2.1 Write `aggregate-root.spec.ts` — event recording, pull/clear semantics, version assertion
- [x] 2.2 Implement `aggregate-root.ts` — extends Entity, private DomainEvent list, recordEvent(), pullEvents(), clearEvents(), assertVersion()

## Phase 3: Wiring & Verification

- [x] 3.1 Update `src/index.ts` — re-export all new classes from lib/
- [x] 3.2 `nx test shared-kernel` — all tests pass (49/49)
- [x] 3.3 `nx build shared-kernel` — clean compilation
- [x] 3.4 `nx lint shared-kernel` — passes

## Phase 4: Roadmap

- [x] 4.1 Update `docs/09-tracking/implementation-roadmap.md` — mark Phase 2 shared-kernel tasks as done
