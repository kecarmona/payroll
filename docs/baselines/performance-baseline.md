# Performance Baseline — Distributed Payroll Processing Engine

> **⚠️ Machine-Specific**: These numbers reflect the environment where the test
> was executed. They are NOT production targets — they establish a repeatable
> baseline for detecting regressions during development.
>
> Run `k6/README.md` instructions to regenerate baselines on your machine.

## Environment

| Attribute | Value |
|---|---|
| **Machine** | MacBook Pro (Apple Silicon) |
| **OS** | macOS (Darwin) |
| **Chip** | Apple M-series (ARM64) |
| **RAM** | — |
| **Docker resources** | Default |
| **Services** | All 8 microservices (ports 3001-3008), running locally via `nx serve` |
| **Databases** | PostgreSQL, MongoDB, Redis (Docker Compose) |
| **Messaging** | Apache Kafka — 1 broker, KRaft mode (Docker Compose) |
| **k6 version** | v1.6.1 |
| **Date** | 2026-07-17 |

## Baseline Metrics

### Scenario 1: Payroll Job Creation Under Load

**Script**: `k6/scenarios/create-payroll-job.js`
**Configuration**: 50 concurrent VUs, 10s ramp-up, 30s steady, 5s ramp-down.

| Metric | Target | Observed | Status |
|---|---|---|---|
| p95 response time | < 500 ms | **11.3 ms** | ✅ Pass |
| Error rate | < 1% | **0.026%** (1/3799) | ✅ Pass |
| Throughput | > 10 req/s | **80.2 req/s** | ✅ Pass |
| Job create latency p95 | — | **6.1 ms** | ℹ️ Reference |
| E2E flow duration p95 | — | **2.4 s** | ℹ️ Reference |

### Scenario 2: Large Payroll Processing (1,000 Employees)

**Script**: `k6/scenarios/process-large-payroll.js`
**Configuration**: 1 VU, single iteration, 120s processing timeout.

| Metric | Target | Observed | Status |
|---|---|---|---|
| Job creation time | < 30 s | **7.2 ms** | ✅ Pass |
| Processing time (create → COMPLETE) | < 60 s | **> 120 s (timeout)** | ❌ Fail |
| Transactions persisted after 120s | = 1,000 | **367 / 1,000** | ❌ Fail |
| Payslips generated after 120s | = 1,000 | **0** | ❌ Fail |

> ⚠️ **Performance Finding**: Processing 1,000 employee transactions exceeds the
> 60s target on this local development machine. Only ~367/1,000 transactions were
> processed in 120s (~3 tx/s). The bottleneck is expected: single Kafka consumer,
> sequential transaction processing, 5s outbox poll interval, per-transaction DB
> writes. Actual throughput will vary based on hardware, Kafka partition count,
> and consumer concurrency.

### Scenario 3: Dashboard Read Performance

**Script**: `k6/scenarios/dashboard-reads.js`
**Configuration**: 100 concurrent VUs, 15s ramp-up, 60s steady, 5s ramp-down,
during active payroll processing.

| Metric | Target | Observed | Status |
|---|---|---|---|
| p95 response time | < 300 ms | **10.2 ms** | ✅ Pass |
| Error rate | < 0.1% | **0%** (0/13,414) | ✅ Pass |
| Throughput | > 20 req/s | **160.7 req/s** | ✅ Pass |

## Known Bottlenecks

| Bottleneck | Impact | Status | Notes |
|---|---|---|---|
| Kafka consumer throughput (single) | Large payroll (1,000 emp) not processed within 120s | ⏳ Pending | Sequential processing with 5s outbox poll. Scale via more Kafka partitions + consumer replicas. |
| Sequential transaction processing | Each payroll transaction processed one at a time | ⏳ Pending | Could batch transactions within a single consumer iteration |

## Run Log

| Date | Scenario | p95 | p99 | Errors | Notes |
|---|---|---|---|---|---|
| 2026-07-17 | create-payroll-job | 11.3 ms | — | 1/3799 (0.026%) | First run — new perf user registered |
| 2026-07-17 | dashboard-reads | 10.2 ms | — | 0/13414 (0%) | Active processing job created for 1,000 employees |
| 2026-07-17 | process-large-payroll | — | — | — | Timeout — 367/1000 tx in 120s |

## Regeneration Instructions

```bash
# 1. Ensure all services are running
docker compose ps && for p in 3001 3002 3003 3004 3005 3006 3007 3008; do
  curl -sf "http://localhost:$p/health/live" > /dev/null && echo "port $p OK" || echo "port $p DOWN"
done

# 2. Run each scenario in order (30s gap between)
k6 run k6/scenarios/create-payroll-job.js
sleep 30
k6 run k6/scenarios/dashboard-reads.js
sleep 30
k6 run k6/scenarios/process-large-payroll.js

# 3. Update this document with results from k6/output/*.json
```

> Run each scenario at least 3 times and report the median. Discard the first
> run (cold caches — JIT compilation, database buffers).
