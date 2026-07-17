# E2E Workflow Test Specification

## Purpose

Validate the complete payroll processing chain across all 8 microservices (auth, employee, payroll, payroll-processing, projection, notification, email, audit) as a single orchestrated flow. Catch integration defects — missing endpoints, Kafka delivery gaps, idempotency breaks, async state consensus failures — that per-service tests cannot detect.

## Requirements

### Requirement: Test Suite Structure

The E2E test suite MUST reside at `test/e2e/` and use Jest 29.7 with ts-jest.

#### Scenario: Suite executes without infrastructure errors

- GIVEN all 8 services are running and healthy
- WHEN `jest --config test/e2e/jest-e2e.config.ts` is invoked
- THEN all test files under `test/e2e/` are discovered and executed

### Requirement: Test Helper Library

The suite SHOULD provide `test/e2e/helpers/` with these classes:

| Class | Responsibility |
|-------|---------------|
| `TestOrchestrator` | Manages sequential test phases and shared state |
| `TestFixtureFactory` | Generates valid CompanyId, Employee, Period, Job data |
| `ApiClient` | Wraps HTTP calls with JWT injection and idempotency headers |
| `Poller` | Polls an endpoint until a predicate is met (30×1s default) |
| `DatabaseCleaner` | Truncates all service tables between test runs |

#### Scenario: DatabaseCleaner isolates test runs

- GIVEN a previous test run inserted data across all 8 services
- WHEN `DatabaseCleaner.clean()` executes
- THEN all tables in PostgreSQL services are truncated
- AND all collections in MongoDB (projection-service) are dropped

#### Scenario: Poller times out on missing terminal state

- GIVEN the Poller is configured with 3 attempts × 500ms
- WHEN the target endpoint never returns the expected predicate
- THEN the Poller throws a `PollerTimeoutError` after the last attempt

### Requirement: Happy Path — Full Payroll Flow

The suite MUST execute the complete sequence: register user → authenticate → create employees → create period → create job → poll for completion → verify projections and audit.

#### Scenario: Complete payroll cycle succeeds

- GIVEN a registered and authenticated HR user with a valid JWT
- WHEN the test creates 1 payroll period and 2 employees
- AND sends `POST /payroll-jobs` with an `Idempotency-Key` header
- AND polls `GET /api/projections/jobs/:jobId` until `status=Completed`
- THEN processing-service reports 2 transactions with correct amounts
- AND projection-service shows updated period summaries in MongoDB
- AND audit-service records a `PayrollJobCompleted` event

### Requirement: HTTP Idempotency

The suite MUST prove that replaying a `POST` with the same `Idempotency-Key` does not create duplicate state.

#### Scenario: Duplicate HTTP request returns cached result

- GIVEN a successful `POST /payroll-jobs` returned 201
- WHEN the same request is replayed with the identical `Idempotency-Key`
- THEN the response is 200 (not 201)
- AND processing-service still shows exactly 2 transactions (no duplicates)

### Requirement: Kafka Message Idempotency

The suite MUST prove that a duplicate `PayrollJobCreated` event on Kafka does not trigger duplicate processing.

#### Scenario: Replayed Kafka event is safely ignored

- GIVEN a payroll job completed successfully
- WHEN a duplicate `PayrollJobCreated` message is published to the same Kafka topic
- AND the test polls for terminal state again
- THEN no new transactions or payslips appear
- AND the audit trail contains no duplicate entries

### Requirement: Validation Error Handling

The suite MUST verify that invalid input is rejected before any processing begins.

#### Scenario: Create job with nonexistent period returns 404

- GIVEN a valid JWT and employee IDs
- WHEN `POST /payroll-jobs` is sent with a `periodId` that does not exist
- THEN the response status is 404
- AND no job is created (projection endpoints return 404 for that jobId)

### Requirement: Async Polling Contract

The suite MUST use adaptive polling (not fixed waits) to tolerate variable Kafka delivery latency.

#### Scenario: Poller resolves terminal state within budget

- GIVEN a payroll job is submitted to payroll-service
- WHEN the Poller polls `GET /api/projections/jobs/:jobId` every 1s
- THEN within 30 attempts the response body shows `status=Completed` or `status=Failed`
- AND the Poller returns the terminal payload

#### Scenario: Poller fails fast on 404

- GIVEN a job ID that was never created
- WHEN the Poller calls `GET /api/projections/jobs/:nonExistentId`
- THEN a 404 response immediately terminates the poll (throwing `PollerTimeoutError`)

### Requirement: Test Environment Readiness

All 8 services MUST be running before the test suite starts. Test initialization SHOULD probe each service's health endpoint.

#### Scenario: Health check gate prevents premature execution

- GIVEN the test suite starts
- WHEN any service health endpoint returns non-200
- THEN the suite fails immediately with a clear message identifying the unavailable service

### Requirement: Unique Per-Run Identifiers

Each test run MUST use a unique idempotency key and employee dataset to prevent cross-run collisions.

#### Scenario: Parallel runs do not interfere

- GIVEN two concurrent test suite executions
- WHEN both create payroll jobs with different `Idempotency-Key` values and distinct employees
- THEN both jobs complete independently
- AND no cross-contamination appears in projections or audit
