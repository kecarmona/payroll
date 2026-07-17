# Design: Add Performance Tests

## Technical Approach

Three k6 load test scenarios that target the live Docker Compose stack. Each script is self-contained: `setup()` logs in via auth-service to get a JWT, seeds required data (period, employees), runs the load, then `teardown()` verifies data integrity via API checks. Metrics captured via k6's `Trend` collector and exported as JSON summary. No code changes to services — tests are entirely external.

## Architecture Decisions

| Decision | Option | Tradeoff | Choice |
|----------|--------|----------|--------|
| Auth strategy | (A) login per VU (B) hardcoded token | (A) adds ~30ms latency to each VU init (B) fragile if token format changes | **B** — generate JWT once in setup, pass via `__ENV` or shared data |
| Data seeding | (A) seed via API in setup (B) direct DB insert | (A) realistic, works with auth guards (B) faster but bypasses domain logic | **A** — tests must validate the real endpoint path |
| Idempotency keys | (A) static per scenario (B) dynamic UUID per request | (A) can't run parallel VUs (B) ensures each request is unique | **B** — `uuidv4()` per iteration, passed as header |
| Metrics output | (A) CLI stdout only (B) `handleSummary()` to JSON | (A) no structured data for baseline doc (B) easy to parse for baseline capture | **B** — JSON summary written to `k6/output/`, referenced in baseline doc |
| Integrity check | (A) in k6 `teardown()` (B) separate script | (A) single pass, guaranteed run (B) manual step easily skipped | **A** — HTTP GET counts + verify no duplicates via projection endpoint |

## Test Data Flow

```
┌─────────────────────────────────────────────────────┐
│                    k6 runner                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────┐ │
│  │ setup()  │──▶│  load()  │──▶│  teardown()      │ │
│  │          │   │          │   │  - verify counts  │ │
│  │ login    │   │ POST/POST│   │  - check no dupes │ │
│  │ seed     │   │ × N VUs  │   │                  │ │
│  └──────────┘   └────┬─────┘   └──────────────────┘ │
│                      │                               │
└──────────────────────┼───────────────────────────────┘
                       │ HTTP
                       ▼
    auth:3001   payroll:3003   projection:3005   processing:3004
         │           │              │                  │
         ▼           ▼              ▼                  ▼
       bcrypt     PostgreSQL     MongoDB             Kafka
       check      + outbox       read-model         consumers
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `k6/README.md` | Create | Prerequisites, execution order, metric interpretation, machine spec for baselines |
| `k6/lib/auth.js` | Create | Shared login helper — `getToken(companyId)` via `POST /auth/login` |
| `k6/lib/helpers.js` | Create | Shared helpers — `randomCompanyId()`, `randomEmployees(n)`, `Idempotency-Key` generation |
| `k6/scenarios/create-payroll-job.js` | Create | 50 concurrent `POST /payroll/jobs` requests, measure p95, verify idempotency |
| `k6/scenarios/process-large-payroll.js` | Create | 1,000-employee payroll: create job + poll processing completion |
| `k6/scenarios/dashboard-reads.js` | Create | 100 concurrent `GET /api/projections/jobs` during active processing |
| `package.json` | Modify | Add `test:perf:*` npm scripts for each scenario |
| `docs/baselines/performance-baseline.md` | Create | Captured p95/p99 latencies, error rates, machine specs, bottleneck notes |

## Interfaces / Contracts

### k6 Thresholds (shared across scenarios)

```javascript
// Each scenario defines its own thresholds matching the spec targets
export const thresholds = {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],  // per-scenario override
  http_req_failed: ['rate<0.01'],
};
```

### Auth Token Flow

```javascript
// lib/auth.js — called once in setup(), token shared to all VUs
export function getToken(baseUrl) {
  const res = http.post(`${baseUrl}/auth/login`, {
    email: 'perf-test@payroll.local',
    password: 'perf-test-password',
  });
  return res.json().accessToken; // JWT Bearer token
}
```

### Data Integrity Verification

```javascript
// In teardown() — verify no duplicates after load
export function verifyIntegrity(baseUrl, token, jobId, expectedCount) {
  const res = http.get(
    `${baseUrl}/api/projections/jobs/${jobId}?companyId=perf-company`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  check(res, {
    'transaction count matches employees': (r) =>
      r.json().transactionCount === expectedCount,
    'no duplicate payslips': (r) =>
      new Set(r.json().payslips.map(p => p.id)).size === r.json().payslips.length,
  });
}
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Validation | Each k6 script runnable | `k6 run --dry-run` — parses script, validates syntax and thresholds |
| Scenario | create-payroll-job | 10s ramp-up, 30s steady 50 VUs, 5s ramp-down |
| Scenario | process-large-payroll | Single job for 1,000 employees, poll until processed or timeout (120s) |
| Scenario | dashboard-reads | 15s ramp-up, 60s steady 100 VUs during active processing |
| Integrity | Post-run DB check | Verify transaction count and duplicate payslips via projection API |

## Migration / Rollout

No migration required. Tests run against existing infrastructure with no code changes to services. Dependencies: Docker Compose up, all 8 services running, k6 CLI installed.

## Open Questions

- [ ] Which test user credentials to hardcode for JWT generation? (Need a pre-seeded user or setup step to register one)
- [ ] Should `docs/baselines/performance-baseline.md` track machine specs in a structured (YAML) or prose format?
- [ ] Does local Docker CPU/memory allocation need an explicit recommendation in the README?
