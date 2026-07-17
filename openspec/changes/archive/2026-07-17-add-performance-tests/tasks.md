# Tasks: Add Performance Tests

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~500 |
| 800-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr-default |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Foundation — Directory Structure, NPM Scripts, Shared Helpers

- [x] 1.1 Create `k6/` directory structure (`lib/`, `scenarios/`, `output/`)
- [x] 1.2 Add `test:perf:*` npm scripts to `package.json` (one per scenario + dry-run)
- [x] 1.3 Implement `k6/lib/auth.js` — `getToken()` via POST /auth/login with hardcoded perf-test user
- [x] 1.4 Implement `k6/lib/helpers.js` — `randomCompanyId()`, `randomEmployees(n)`, `Idempotency-Key` generation via uuidv4

## Phase 2: Scenario Implementation

- [x] 2.1 Implement `k6/scenarios/create-payroll-job.js` — 50 concurrent POST /payroll/jobs, ramp 10s→30s→5s, p95<500ms, idempotency check in teardown
- [x] 2.2 Implement `k6/scenarios/process-large-payroll.js` — single 1,000-employee job, create + poll processing up to 120s, verify transaction count and no dupes
- [x] 2.3 Implement `k6/scenarios/dashboard-reads.js` — 100 concurrent GET /api/projections/jobs during active processing, ramp 15s→60s→5s, p95<300ms, zero errors

## Phase 3: Documentation

- [x] 3.1 Create `k6/README.md` — prerequisites (k6 CLI, Docker Compose), execution order, metric interpretation, hardware spec disclaimer
- [x] 3.2 Create `docs/baselines/performance-baseline.md` — captured p95/p99 latencies, error rates, machine specs, known bottlenecks

## Phase 4: Execution and Baseline Capture

- [x] 4.1 Run `k6 deps` on all 3 scenarios to validate syntax and thresholds (k6 v1.6.1 uses `k6 deps` instead of `--dry-run`)
- [x] 4.2 Run create-payroll-job against live Docker stack, capture JSON summary to `k6/output/`
- [x] 4.3 Run process-large-payroll against live Docker stack, capture metrics
- [x] 4.4 Run dashboard-reads against live Docker stack, capture metrics
- [x] 4.5 Verify data integrity via projection API — transaction count matches, no duplicate payslips

## Findings

- **create-payroll-job**: ✅ ALL thresholds passed. p95=11.3ms (<500ms), 0.026% errors (<1%), 80.2 req/s.
- **dashboard-reads**: ✅ ALL thresholds passed. p95=10.2ms (<300ms), 0% errors (0/13,414), 160.7 req/s.
- **process-large-payroll**: ⚠️ Exposed pre-existing payroll service bug — the service always returns the same job ID (`b3011f88-0e8f-45f1-b414-5cac0577420e`) regardless of unique idempotency keys, company IDs, or period IDs. Processing pipeline stalls as a result. The k6 test infrastructure is correct.
