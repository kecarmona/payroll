# Performance Tests — k6 Load Testing

Performance and load test suite for the Distributed Payroll Processing Engine
using [k6](https://k6.io/). Tests validate that the platform meets documented
throughput and latency targets before production deployment.

## Prerequisites

| Requirement | Version | Check |
|---|---|---|
| [k6 CLI](https://k6.io/docs/getting-started/installation/) | ≥ v1.6.1 | `k6 version` |
| Docker Compose | — | `docker compose ps` (all services healthy) |
| All 8 microservices | ports 3001-3008 | See service list below |

### Installing k6

```bash
# macOS (Homebrew)
brew install k6

# Verify installation
k6 version
```

### Docker Compose

All services must be running before executing performance tests:

```bash
# Start all infrastructure + microservices
docker compose up -d

# Verify all 8 services are healthy
for port in 3001 3002 3003 3004 3005 3006 3007 3008; do
  curl -sf "http://localhost:$port/health/live" > /dev/null && \
    echo "port $port OK" || echo "port $port DOWN"
done
```

### Port Map

| Service | Port | Health Endpoint |
|---|---|---|
| auth-service | 3001 | `/health/live` |
| employee-service | 3002 | `/health/live` |
| payroll-service | 3003 | `/health/live` |
| payroll-processing-service | 3004 | `/health/live` |
| payroll-projection-service | 3005 | `/health/live` |
| notification-service | 3006 | `/health/live` |
| email-service | 3007 | `/health/live` |
| audit-service | 3008 | `/health/live` |

## Execution

### Quick Start (Dry Run)

Validate all scripts parse correctly and thresholds are well-formed:

```bash
k6 run --dry-run k6/scenarios/create-payroll-job.js
k6 run --dry-run k6/scenarios/process-large-payroll.js
k6 run --dry-run k6/scenarios/dashboard-reads.js
```

### Via npm Scripts

```bash
# Dry run validation
pnpm test:perf:dry-run

# Run individual scenarios
pnpm test:perf:create-payroll-job
pnpm test:perf:process-large-payroll
pnpm test:perf:dashboard-reads

# Run all scenarios sequentially
pnpm test:perf:all
```

### Directly via k6

```bash
# Create payroll job (50 concurrent, p95<500ms)
k6 run k6/scenarios/create-payroll-job.js

# Large payroll processing (1,000 employees)
k6 run k6/scenarios/process-large-payroll.js

# Dashboard reads (100 concurrent, p95<300ms)
k6 run k6/scenarios/dashboard-reads.js
```

### Output

Each test writes a structured JSON summary to `k6/output/`:
- `create-payroll-job-summary.json`
- `process-large-payroll-summary.json`
- `dashboard-reads-summary.json`

These summaries feed into the baseline documentation at
`docs/baselines/performance-baseline.md`.

## Execution Order

Run scenarios in the following order for best results:

1. **create-payroll-job** — Lightest, validates auth & basic throughput
2. **dashboard-reads** — Medium, tests read-model performance (may overlap with 3)
3. **process-large-payroll** — Heaviest, validates full pipeline throughput

Leave at least 30 seconds between scenarios for Kafka consumers to settle
and databases to reach idle state.

## Metric Interpretation

### Standard k6 Metrics

| Metric | What It Measures | Target |
|---|---|---|
| `http_req_duration` | End-to-end request latency | Per scenario |
| `http_req_failed` | Fraction of failed requests | < 1% |
| `http_reqs` | Request throughput (requests/s) | > 10 |

### Custom Metrics (process-large-payroll)

| Metric | What It Measures | Target |
|---|---|---|
| `setup_duration_seconds` | Time to seed test data | — |
| `job_create_duration_seconds` | POST /payroll/jobs response time | < 30s |
| `processing_duration_seconds` | Job creation → COMPLETED | < 60s |
| `transaction_count` | Number of persisted transactions | = employee count |

### Threshold Violations

If a threshold is crossed, k6 exits with non-zero code and prints
violated thresholds in the summary. Investigate in this order:

1. **Docker resource contention** — Check `docker stats` for CPU/memory
2. **Kafka consumer lag** — Check Kafka UI at `http://localhost:8080`
3. **Database connection pool** — Check PG/Mongo connection counts
4. **Service logs** — `docker compose logs <service> --tail=50`

## Hardware Spec Disclaimer

Performance baselines are **machine-specific**. The numbers captured in
`docs/baselines/performance-baseline.md` reflect the environment where the
test was run. Document your machine specs before running:

```bash
# macOS
system_profiler SPHardwareDataType | grep -E "Chip|Memory"

# Linux
cat /proc/cpuinfo | grep "model name" | head -1
free -h
```

Run at least **3 iterations** of each scenario before updating baselines.
Discard the first run (cold caches), average the next two.

## Test Data

Each test creates and tears down its own data using isolated company IDs
(`perf-co-{uuid}`). Tests do NOT share state and do NOT require pre-seeded
databases.

The auth step registers a `perf-test@payroll.local` user on first run;
subsequent runs reuse the existing user. No manual setup needed.
