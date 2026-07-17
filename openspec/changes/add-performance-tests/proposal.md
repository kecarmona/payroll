# Proposal: Add Performance Tests

## Intent

Add performance/load tests to validate that the payroll platform meets documented throughput targets before production deployment. Currently, all testing is functional (unit/integration) — there is no empirical data on whether the system meets p95 latency goals for job creation, large payroll processing, or dashboard reads.

## Scope

### In Scope
- k6 load test for concurrent payroll job creation (p95 < 500ms)
- k6 load test for 1,000-employee payroll job (< 30s create, < 60s process)
- k6 load test for dashboard read model queries during active processing (p95 < 300ms)
- k6 test scripts, configuration, and README
- Measured baseline document with captured metrics
- Bottleneck documentation

### Out of Scope
- Chaos/failure tests (separate `add-chaos-tests` change)
- Production-level tuning or configuration changes
- CI pipeline integration
- Stress, spike, or soak testing
- k6 Cloud integration

## Capabilities

### New Capabilities
None — this is a cross-cutting testing artifact, not a product capability.

### Modified Capabilities
None — no existing spec requirements are changed.

## Approach

Use k6 (as specified in AGENTS.md and the testing stack) to write JavaScript-based load test scripts. Each scenario runs against local Docker Compose infrastructure with all 8 services, PostgreSQL, MongoDB, Redis, and Kafka running. Tests measure p95 and p99 latencies against the targets from `docs/03-tdd/08-performance.md`. Results recorded in a baseline document (`docs/baselines/performance-baseline.md`).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `k6/` | New | k6 test scripts directory |
| `docs/baselines/performance-baseline.md` | New | Captured metric baselines |
| `package.json` | Modified | Add k6-related npm scripts |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Local machine variability skews baselines | High | Run multiple iterations, document machine specs, use p95 not absolute values |
| Kafka partition count limits throughput | Medium | Document observed partition ceiling, note as bottleneck |
| Docker resource contention (8 services) | Medium | Allocate sufficient Docker resources, run one scenario at a time |
| No k6 expertise in team | Low | k6 JS API is straightforward; document patterns in README |

## Rollback Plan

Revert `package.json` script additions, delete `k6/` directory and baseline doc. No infrastructure or source code changes, so rollback is clean.

## Dependencies

- Docker Compose up with all 8 services plus PostgreSQL, MongoDB, Redis, Kafka
- k6 CLI installed locally

## Success Criteria

- [ ] Payroll job creation p95 < 500ms under 50 concurrent requests
- [ ] 1,000-employee payroll job creates in < 30s, processes in < 60s
- [ ] Dashboard reads p95 < 300ms under 100 concurrent reads during active processing
- [ ] No data corruption or duplicate transactions during tests
- [ ] Baseline document published with all captured metrics
- [ ] Bottlenecks identified and documented as follow-up items
