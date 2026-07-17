# Tasks: Validate End-to-End Payroll Workflow

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~780 (11 new, 1 modified) |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (infrastructure) → PR 2 (scenarios) |
| Delivery strategy | single-pr |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Test infrastructure — helpers, config, jest setup, DB clean | PR 1 | Base branch = feature/validate-e2e-payroll. All helpers independently testable. |
| 2 | Orchestrator + 3 scenario specs | PR 2 | Depends on PR 1 helpers. Base = PR 1 branch. Verifies full workflow. |

## Phase 1: Test Infrastructure

- [ ] 1.1 Add `axios`, `pg`, `mongodb` devDeps to `package.json`; create `test:e2e` script
- [ ] 1.2 Create `test/e2e/tsconfig.e2e.json` extending `tsconfig.base.json`
- [ ] 1.3 Create `test/e2e/jest.config.ts` — ts-jest transform, 60s timeout, e2e test match
- [ ] 1.4 Create `test/e2e/helpers/config.ts` — service URLs, ports, DB connection strings, 30s timeout
- [ ] 1.5 Create `test/e2e/helpers/api-client.ts` — Axios client with JWT auto-attach, idempotency headers, typed methods for all 8 services
- [ ] 1.6 Create `test/e2e/helpers/fixture-factory.ts` — UUID-based CompanyId, Employee, Period, Job payloads
- [ ] 1.7 Create `test/e2e/helpers/poller.ts` — async poll with predicate, 1s interval, 30 max attempts, fail-fast on 404
- [ ] 1.8 Create `test/e2e/helpers/database-cleaner.ts` — truncate all PostgreSQL tables, drop MongoDB collections

## Phase 2: Orchestrator & Scenarios

- [ ] 2.1 Create `test/e2e/helpers/orchestrator.ts` — sequential phase manager: healthCheck → authenticate → createEmployees → createPeriod → createJob → waitForCompletion → verifyTransactions/verifyPayslips/verifyAuditRecords
- [ ] 2.2 Create `test/e2e/scenarios/happy-path.spec.ts` — 3 employees → period → job → poll Completed → verify 3 transactions, 3 payslips in MongoDB, audit record in PostgreSQL
- [ ] 2.3 Create `test/e2e/scenarios/idempotency.spec.ts` — HTTP replay (same Idempotency-Key → 200, no duplicates) + Kafka duplicate PayrollJobCreated via kafkajs producer, poll terminal, assert no extra records
- [ ] 2.4 Create `test/e2e/scenarios/validation.spec.ts` — nonexistent periodId → 404, no job created; missing JWT → 401; missing fields → 400

## Phase 3: Verify

- [ ] 3.1 Run `npx jest --config test/e2e/jest.config.ts` — all 3 scenarios pass against live services
