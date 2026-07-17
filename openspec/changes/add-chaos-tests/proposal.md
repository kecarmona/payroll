# Proposal: add-chaos-tests

## Intent

Add controlled failure tests to validate resilience, recovery, and data safety across the distributed payroll pipeline. The existing E2E and performance tests verify correctness under normal load — chaos tests verify the system survives dependency failures without silent data loss.

## Scope

### In Scope
- Kafka unavailable — stop Kafka during outbox publishing, verify retry + no data loss
- PostgreSQL unavailable — stop Postgres for processing service, verify consumer retry
- MongoDB unavailable — stop MongoDB during projection updates, verify retry
- Duplicate Kafka message — replay `PayrollJobCreated`, verify no duplicate transactions
- Consumer crash — kill consumer after DB commit, verify redelivery + idempotency

### Out of Scope
- Redis unavailable test (no Redis-based idempotency implemented yet)
- Production-level chaos engineering (Litmus, Gremlin, Chaos Mesh)
- Network partition or latency injection tests
- Disk/CPU/memory pressure tests

## Capabilities

### New Capabilities
- `chaos-tests`: Shell-script-based failure injection tests using `docker compose stop/start`, verified against E2E test infrastructure

### Modified Capabilities
- None

## Approach

Shell scripts in `chaos/` directory, one per scenario. Each script: (1) runs E2E test to establish baseline state (e.g., create payroll job), (2) injects failure via `docker compose stop <service>`, (3) triggers the affected operation, (4) restores service via `docker compose start <service>`, (5) asserts recovery via health checks + data integrity queries. Scripts reuse the existing E2E test infrastructure (`libs/testing`, Docker Compose services) and record evidence per the template in `docs/06-testing/chaos-plans.md`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `chaos/kafka-unavailable.sh` | New | Kafka failure injection + recovery test |
| `chaos/postgres-unavailable.sh` | New | PostgreSQL failure injection test |
| `chaos/mongo-unavailable.sh` | New | MongoDB failure injection test |
| `chaos/duplicate-message.sh` | New | Duplicate Kafka message replay test |
| `chaos/consumer-crash.sh` | New | Consumer crash + redelivery test |
| `chaos/README.md` | New | Execution prerequisites and interpretation |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Docker `stop` leaves containers in inconsistent state | Low | Use `docker compose down/up` for clean recovery between tests |
| Timing sensitivity — container health check flakiness | Med | Add retry loops with configurable timeouts and polling |
| Test depends on specific service scaling (single consumer) | Low | Document this constraint; revisit when services are scaled |

## Rollback Plan

All tests run in isolation within Docker Compose. Rollback: `docker compose down && docker compose up -d` to reset all containers to clean state. No database migrations, config changes, or persistent side effects.

## Dependencies

- Docker Compose running (same stack as E2E tests)
- Existing service containers (`payroll-service`, `payroll-processing-service`, `payroll-projection-service`)
- Existing event infrastructure (Kafka, outbox publisher)

## Success Criteria

- [ ] All 5 chaos test scripts execute without manual intervention
- [ ] Each script records start time, injected failure, observed behavior, and recovery time
- [ ] Data integrity verified after every failure scenario (no duplicate transactions, no lost events)
- [ ] Tests pass in CI against clean Docker Compose environment
