# Tasks: Setup Local Infrastructure — Add Lint Targets

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~90–100 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr-default |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Add Lint Target — Services (8 files)

- [x] 1.1 Add `@nx/eslint:lint` target to `apps/auth-service/project.json`
- [x] 1.2 Add `@nx/eslint:lint` target to `apps/employee-service/project.json`
- [x] 1.3 Add `@nx/eslint:lint` target to `apps/payroll-service/project.json`
- [x] 1.4 Add `@nx/eslint:lint` target to `apps/payroll-processing-service/project.json`
- [x] 1.5 Add `@nx/eslint:lint` target to `apps/payroll-projection-service/project.json`
- [x] 1.6 Add `@nx/eslint:lint` target to `apps/notification-service/project.json`
- [x] 1.7 Add `@nx/eslint:lint` target to `apps/email-service/project.json`
- [x] 1.8 Add `@nx/eslint:lint` target to `apps/audit-service/project.json`

## Phase 2: Add Lint Target — Libraries (4 files)

- [x] 2.1 Add `@nx/eslint:lint` target to `libs/shared-kernel/project.json`
- [x] 2.2 Add `@nx/eslint:lint` target to `libs/contracts/project.json`
- [x] 2.3 Add `@nx/eslint:lint` target to `libs/event-bus/project.json`
- [x] 2.4 Add `@nx/eslint:lint` target to `libs/testing/project.json`

## Phase 3: Verify

- [x] 3.1 Run `pnpm lint` (nx run-many -t lint) — all 12 projects exit 0
- [x] 3.2 Smoke test: `nx lint auth-service` + `nx lint shared-kernel` resolve correctly

## Phase 4: Update Roadmap

- [x] 4.1 Mark `setup-local-infrastructure` OpenSpec change done in `docs/09-tracking/implementation-roadmap.md`
- [x] 4.2 Mark tasks 103–105 (Configure ESLint) done
- [x] 4.3 Update Completion Tracker for Phase 1

## Implementation Order

Phase 1 → Phase 2 → Phase 3 (after all targets exist) → Phase 4 (after verification). Phases 1 and 2 can run in any order within themselves — no cross-file dependency.
