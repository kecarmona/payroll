# Tasks: Add Chaos Tests

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~750 |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr-default |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: High

## Phase 1: Infrastructure

- [x] 1.1 Create `test/chaos/jest.config.ts` — Jest config with node env, 180s timeout, chaos scenario paths
- [x] 1.2 Create `test/chaos/tsconfig.chaos.json` — TSConfig extending base, targeting test/chaos
- [x] 1.3 Create `test/chaos/helpers/chaos-orchestrator.ts` — ChaosOrchestrator extending E2eOrchestrator with `stopService`, `startService`, `waitForServiceHealthy`, `getConsumerPid`, `killConsumer`, and `recordEvidence`
- [x] 1.4 Create `test/chaos/evidence/.gitkeep`

## Phase 2: Scenario Implementation

- [x] 2.1 Create `test/chaos/scenarios/kafka-unavailable.spec.ts` — Stop Kafka, verify outbox retry + no data loss
- [x] 2.2 Create `test/chaos/scenarios/postgres-unavailable.spec.ts` — Stop Postgres, verify consumer safe fail + retry
- [x] 2.3 Create `test/chaos/scenarios/mongo-unavailable.spec.ts` — Stop MongoDB, verify projection retry + data integrity
- [x] 2.4 Create `test/chaos/scenarios/duplicate-message.spec.ts` — Replay PayrollJobCreated directly to Kafka, verify noop
- [x] 2.5 Create `test/chaos/scenarios/consumer-crash.spec.ts` — Kill consumer after DB commit, verify redelivery + idempotency

## Phase 3: Wiring & Verification

- [x] 3.1 Add `test:chaos` script to root `package.json` — `pnpm jest --config test/chaos/jest.config.ts`
- [ ] 3.2 Verify all 5 scenarios execute against clean Docker Compose stack
- [ ] 3.3 Verify evidence JSON files written to `test/chaos/evidence/` with all required fields

## Implementation Notes

- **Design deviation**: ChaosOrchestrator uses `exec("docker compose stop/start")` via `child_process`, not shell scripts. Consumer crash uses `docker kill` for container-level failure, not PID-based kill (see design open question).
- **Dependency**: All scenarios depend on ChaosOrchestrator (1.3). Scenario specs (Phase 2) are independent of each other and can be parallelized.
- **Not TDD-tight**: Chaos tests are E2E/integration scenarios, not unit tests. Follow existing e2e spec pattern (describe/beforeAll/it) with failure injection wrappers.
