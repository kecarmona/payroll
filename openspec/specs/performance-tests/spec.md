# Performance Tests Specification

## Purpose

Define performance and load test scenarios to validate the payroll platform meets documented throughput targets before production deployment. Tests measure p95/p99 latencies against baselines from `docs/03-tdd/08-performance.md`.

## Test Infrastructure

### Requirement: k6 Test Scaffold

The project MUST include a `k6/` directory with runnable k6 test scripts and a README documenting execution.

#### Scenario: Scripts exist and are runnable

- GIVEN the `k6/` directory exists
- WHEN running `k6 run k6/<script>.js`
- THEN the script executes without syntax errors
- AND connects to the Docker Compose infrastructure

#### Scenario: README documents execution

- GIVEN the `k6/README.md` exists
- WHEN reading the README
- THEN it describes prerequisites, execution order, and metric interpretation

### Requirement: NPM Integration

The project SHOULD provide npm scripts in `package.json` to run each load test scenario.

#### Scenario: Script shortcuts exist

- GIVEN `package.json` scripts section
- WHEN running `pnpm test:perf:create-payroll`
- THEN the corresponding k6 script executes

## Load Test Scenarios

### Requirement: Payroll Job Creation Under Load

The payroll job creation endpoint MUST sustain p95 response time below 500 ms under 50 concurrent requests.

#### Scenario: Concurrent creation within limits

- GIVEN 50 concurrent create-payroll-job requests
- WHEN all requests complete
- THEN p95 latency is below 500 ms
- AND zero requests return 5xx errors

#### Scenario: Duplicate idempotent requests

- GIVEN 50 concurrent requests with identical company+period data
- WHEN the payload includes the same `Idempotency-Key`
- THEN only one payroll job is created
- AND duplicate requests return 409 Conflict or 200 OK

### Requirement: Large Payroll Processing Throughput

Processing a 1,000-employee payroll job MUST complete within 30 seconds for creation and 60 seconds for processing.

#### Scenario: Create 1,000-transaction payroll

- GIVEN a single payroll job for 1,000 employees
- WHEN the create endpoint is called
- THEN the job is created in under 30 seconds
- AND 1,000 payroll transactions are persisted

#### Scenario: Process all transactions

- GIVEN a payroll job with 1,000 persisted transactions
- WHEN the processing pipeline completes
- THEN all transactions are processed in under 60 seconds
- AND no duplicate payslips are generated

### Requirement: Dashboard Read Performance Under Load

Dashboard read model queries MUST sustain p95 response time below 300 ms under 100 concurrent reads during active payroll processing.

#### Scenario: Read during active processing

- GIVEN a payroll job is actively processing 1,000 employees
- WHEN 100 concurrent GET requests hit the dashboard projection endpoint
- THEN p95 response time is below 300 ms
- AND zero requests return errors

#### Scenario: Consistent projection reads

- GIVEN continuous dashboard reads during processing
- WHEN measuring projection lag
- THEN the lag is observable through metrics
- AND no read returns stale data from a failed transaction

## Measurement Methodology

### Requirement: Metrics Capture

Each test run MUST capture API response times, job/transaction durations, Kafka consumer lag, outbox pending count, database query durations, and error rate.

#### Scenario: Metrics output saved

- GIVEN a completed k6 test run
- WHEN the script finishes
- THEN metrics are saved to `docs/baselines/performance-baseline.md`

### Requirement: Data Integrity Verification

Each test run MUST verify no data corruption, no duplicate transactions, and no duplicate payslips occurred.

#### Scenario: Integrity check after test

- GIVEN a test run completes
- WHEN querying payroll and payslip tables
- THEN transaction count matches expected employees
- AND no duplicate payslips exist

## Non-Goals

The following are explicitly NOT in scope: chaos/failure testing, stress testing (beyond normal load), spike testing, soak testing, production-level tuning, CI pipeline integration, and k6 Cloud integration.
