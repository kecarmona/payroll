# Design: add-chaos-tests

## Technical Approach

Jest-based chaos tests under `test/chaos/` that reuse the existing E2E infrastructure (E2eOrchestrator, ApiClient, DatabaseCleaner) and inject failures via `child_process.exec` calling `docker compose stop/start`. Evidence is recorded as structured JSON. This deviates from the proposal's "shell scripts" — the existing TypeScript/Jest pattern provides stronger assertions, state management, and direct DB/Kafka access without fragile shell-to-test handoffs.

## Architecture Decisions

### Decision: Jest tests over shell scripts

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Shell scripts calling `pnpm jest` per phase | Fragile state handoff, no shared fixture context | Rejected |
| **Jest tests using exec for docker** | Full access to E2eOrchestrator + assertions, single process | **Chosen** |

### Decision: Extend E2eOrchestrator vs standalone helper

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **New ChaosOrchestrator extending E2eOrchestrator** | Reuses setup/cleanup/poller; adds docker control + evidence | **Chosen** |
| Standalone docker-control helper called from test files | Duplicates setup logic, loses orchestrator lifecycle | Rejected |

### Decision: Evidence logging

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Structured JSON per scenario** | Machine-parseable, CI-friendly, simple schema | **Chosen** |
| Console output only | Lost in CI logs, not queryable | Rejected |

## Data Flow (per scenario)

```
test/chaos/<scenario>.spec.ts
  │
  ├─ 1. Health check + clean DB (via ChaosOrchestrator.healthCheck)
  ├─ 2. Setup fixtures (register, login, create employees, period)
  ├─ 3. Establish baseline state (create job, verify projections)
  │
  ├─ 4. Record START evidence
  ├─ 5. Inject failure (exec: docker compose stop <service>)
  ├─ 6. Trigger affected operation
  ├─ 7. Assert expected behavior during failure
  ├─ 8. Restore service (exec: docker compose start <service>)
  ├─ 9. Wait for recovery (health check + poll)
  ├─10. Assert data integrity (no duplicates, no corruption)
  └─11. Record END evidence to test/chaos/evidence/<scenario>-<timestamp>.json
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `test/chaos/jest.config.ts` | Create | Jest config for chaos tests (extends E2E pattern) |
| `test/chaos/tsconfig.chaos.json` | Create | TSConfig extending base (mirrors e2e tsconfig) |
| `test/chaos/helpers/chaos-orchestrator.ts` | Create | Extends E2eOrchestrator with docker compose + evidence |
| `test/chaos/scenarios/kafka-unavailable.spec.ts` | Create | Stop Kafka, verify outbox retry, restart, verify delivery |
| `test/chaos/scenarios/postgres-unavailable.spec.ts` | Create | Stop Postgres, verify consumer safe fail, restart, verify retry |
| `test/chaos/scenarios/mongo-unavailable.spec.ts` | Create | Stop MongoDB, verify projection retry, restart, verify catch-up |
| `test/chaos/scenarios/duplicate-message.spec.ts` | Create | Produce duplicate PayrollJobCreated directly to Kafka, verify noop |
| `test/chaos/scenarios/consumer-crash.spec.ts` | Create | Kill consumer after DB commit, verify redelivery + idempotency |
| `test/chaos/evidence/.gitkeep` | Create | Evidence output directory placeholder |

## Interfaces / Contracts

```typescript
// test/chaos/helpers/chaos-orchestrator.ts

interface ChaosEvidence {
  scenario: string;
  startTime: string;       // ISO 8601
  endTime: string;
  injectedFailure: string; // e.g. "docker compose stop kafka"
  affectedService: string;
  expectedBehavior: string;
  actualBehavior: string;
  recoveryDurationMs: number;
  dataIntegrity: 'PASS' | 'FAIL';
  followUpActions: string[];
}

class ChaosOrchestrator extends E2eOrchestrator {
  // Docker compose control
  async stopService(service: string): Promise<void>;
  async startService(service: string): Promise<void>;
  async waitForServiceHealthy(serviceUrl: string, timeoutMs: number): Promise<void>;

  // Consumer lifecycle (consumer-crash scenario)
  async getConsumerPid(): Promise<number | null>;
  async killConsumer(pid: number): Promise<void>;

  // Evidence recording
  async recordEvidence(evidence: ChaosEvidence): Promise<void>;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | ChaosOrchestrator helper | Standard Jest unit tests for docker/evidence methods |
| E2E | Each chaos scenario | Full integration with Docker Compose — **run against live stack** |
| Evidence | JSON output schema | Verify evidence file exists + required fields present |

These are NOT unit tests — they are **controlled failure-injection E2E scenarios**. Each test runs against the full Docker Compose stack and requires all 8 services + 3 infrastructure containers healthy.

## Migration / Rollout

No migration required. Tests run in CI only when explicitly invoked (`pnpm jest --config test/chaos/jest.config.ts`). They require the full Docker Compose stack — not part of default `nx test` to avoid slowing the standard feedback loop.

## Open Questions

- [ ] Consumer crash: how is the consumer process managed in Docker? If a NestJS/Kafka consumer runs inside a container, killing it via `docker compose stop <service>` or `docker kill` may be more appropriate than PID-based kill.
- [ ] Should `kafka-ui` be excluded from service name matching to avoid accidental stop?
