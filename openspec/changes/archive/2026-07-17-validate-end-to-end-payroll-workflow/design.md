# Design: Validate End-to-End Payroll Workflow

## Technical Approach

Standalone Jest 29.7 test suite under `test/e2e/` — not an Nx project. Runs against all 8 services as external HTTP processes. Uses axios for HTTP calls, direct PostgreSQL/MongoDB drivers for database assertions. Orchestrates the full payroll flow: auth → employees → period → job → Kafka → processing → projection → audit.

## Architecture Decisions

| Option | Tradeoffs | Decision |
|--------|-----------|----------|
| **axios** vs supertest | supertest binds in-process; services run externally as separate processes | **axios** — correct for cross-process E2E |
| **Standalone dir** vs Nx project | Nx project ties into monorepo build pipeline; standalone `test/e2e/` has zero build coupling | **Standalone** — independent `jest.config.ts` + tsconfig, run via `npx jest` |
| **DB assertions** vs REST endpoints for audit | Audit service has no GET endpoints (append-only). DB query avoids production code changes | **Direct PostgreSQL query** via `pg` — audit GET endpoint is a separate concern |
| **State polling** vs fixed sleep | Fixed sleep is fragile under variable Kafka latency | **Poller with predicate** — 30 attempts × 1s interval, returns terminal payload |

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Test Suite  │────▶│  Auth Svc    │────▶│ Employee Svc │
│  (orchestrate)│    │  POST /auth/  │     │ POST /employees│
│              │     │  login       │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                        │
       │                                        ▼
       │                               ┌──────────────────┐
       │                               │  Payroll Svc      │
       │                               │ POST /periods     │
       │                               │ POST /jobs        │
       │                               │ (Idempotency-Key) │
       │                               └────────┬─────────┘
       │                                        │
       │                                        ▼  Kafka
       │                               ┌──────────────────────┐
       │                               │ Processing Svc       │
       │                               │ (Kafka consumer)     │
       │                               └──────────┬───────────┘
       │                                          │
       │                ┌─────────────────────────┐│
       │                ▼                         ▼▼
       │    ┌───────────────────┐     ┌──────────────────┐
       │    │ Projection Svc     │     │ Audit Svc         │
       │    │ (MongoDB reads)    │     │ (Postgres writes)  │
       │    │ GET /:jobId        │     │                    │
       │    │ GET /transactions  │     │                    │
       └────│ GET /payslips      │     │ (direct DB assert) │
            └───────────────────┘     └────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `test/e2e/helpers/config.ts` | Create | Service URLs, timeouts, DB connection strings |
| `test/e2e/helpers/api-client.ts` | Create | axios wrapper with JWT auto-attach, idempotency headers |
| `test/e2e/helpers/fixture-factory.ts` | Create | UUID-based CompanyId, Employee, Period, Job fixtures |
| `test/e2e/helpers/poller.ts` | Create | State poller with predicate, configurable interval (1s), max attempts (30), exponential backoff |
| `test/e2e/helpers/orchestrator.ts` | Create | Sequential phase orchestration, shared state, assertions |
| `test/e2e/helpers/database-cleaner.ts` | Create | Truncate all PostgreSQL tables, drop MongoDB collections |
| `test/e2e/scenarios/happy-path.spec.ts` | Create | Full payroll flow: 3 employees → period → job → poll → verify |
| `test/e2e/scenarios/idempotency.spec.ts` | Create | HTTP Idempotency-Key replay + Kafka duplicate message test |
| `test/e2e/scenarios/validation.spec.ts` | Create | 404 on nonexistent period, auth failure, missing params |
| `test/e2e/jest.config.ts` | Create | Jest 29.7 config, ts-jest transform, 60s timeout |
| `test/e2e/tsconfig.e2e.json` | Create | ESM-compatible tsconfig extending base |
| `package.json` | Modify | Add `axios`, `pg`, `mongodb` as devDependencies; add `test:e2e` script |

**Total**: 11 new files, 1 modified. Zero changes to service source code.

## Interfaces / Contracts

```typescript
// API Client
class ApiClient {
  constructor(baseUrl: string)
  async register(email: string, password: string, role: string): Promise<{ userId: string }>
  async login(email: string, password: string): Promise<{ accessToken: string }>
  async createEmployee(dto: CreateEmployeeDto): Promise<{ employeeId: string }>
  async createPeriod(dto: CreatePeriodDto): Promise<{ periodId: string }>
  async createJob(dto: CreateJobDto, idempotencyKey: string): Promise<{ jobId: string; status: string }>
  async getJob(jobId: string, companyId: string): Promise<PayrollJobProjection>
  async getTransactions(jobId: string): Promise<TransactionProjection[]>
  async getPayslips(employeeId: string): Promise<PayslipProjection[]>
}

// Poller
class Poller {
  constructor(config?: { intervalMs?: number; maxAttempts?: number })
  async poll<T>(fetch: () => Promise<T>, predicate: (t: T) => boolean): Promise<T>
}

// Orchestrator — manages phases, tracks created IDs, provides assertions
class Orchestrator {
  private api: ApiClient
  private state: { companyId: string; accessToken: string; employeeIds: string[]; ... }

  async healthCheck(): Promise<void>        // GET /health/live on all 8 services
  async setupFixtures(): Promise<void>       // generate unique IDs
  async authenticate(): Promise<void>        // register + login → JWT
  async createEmployees(count: number): Promise<void>
  async createPeriod(): Promise<void>
  async createJob(): Promise<{ jobId: string }>
  async waitForCompletion(jobId: string): Promise<PayrollJobProjection>
  async verifyTransactions(jobId: string, expectedCount: number): Promise<void>
  async verifyPayslips(employeeIds: string[]): Promise<void>
  async verifyAuditRecords(): Promise<void>  // direct pg query
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| E2E | Full happy path (3 employees) | Orchestrator runs all phases, poller waits for terminal state, all assertions pass |
| E2E | HTTP idempotency | Re-send POST /payroll-jobs with same Idempotency-Key → 200, verify no duplicate trxs |
| E2E | Kafka idempotency | Publish duplicate PayrollJobCreated to topic, poll terminal, verify no duplicates |
| E2E | Validation errors | 404 on nonexistent period, 401 on missing JWT, 400 on missing fields |
| Helper | Poller timeout | Configure 3×500ms, never satisfy predicate → throws PollerTimeoutError |
| Helper | DatabaseCleaner isolation | Run twice, second run starts clean (no FK violations on insert) |

## Migration / Rollout

No migration required. All infrastructure (Docker, Kafka topics) is already running. Tests execute against the live stack.

## Open Questions

- [ ] Audit service has no GET endpoint — test queries `payroll_audit` directly via `pg`. Acceptable for dev E2E?
- [ ] Should the Kafka duplicate message test produce via the test's own Kafka producer (kafkajs) or via payroll-service replay? Recommended: use kafkajs to publish directly to the topic for isolation.
