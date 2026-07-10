# Performance Test Plan

Project

Distributed Payroll Processing Engine

---

# Purpose

Define how the platform validates throughput, latency and scalability expectations.

---

# Test Objectives

- Validate payroll job creation latency.
- Validate payroll transaction throughput.
- Validate projection query performance.
- Validate Kafka consumer scaling.
- Detect bottlenecks in outbox publishing.

---

# Baseline Scenarios

## Scenario 1: Payroll Job Creation

Goal:

- Create payroll jobs safely under concurrent requests.

Load:

- 50 concurrent requests.
- Same company and period duplicates included.

Expected:

- Only one payroll job exists per company and period.
- Duplicate attempts return conflict or idempotent response.
- p95 response time below 500 ms locally.

---

## Scenario 2: Payroll Processing

Goal:

- Process a payroll job with many employees.

Load:

- 1,000 employees.
- One payroll job.

Expected:

- Transactions are processed independently.
- Processing completes within local baseline.
- No duplicate payslips are generated.

---

## Scenario 3: Dashboard Reads

Goal:

- Validate MongoDB projections under read traffic.

Load:

- 100 concurrent dashboard reads during active payroll processing.

Expected:

- p95 response time below 300 ms locally.
- Projection lag remains visible through metrics.

---

# Metrics To Capture

- API response time.
- Payroll job duration.
- Payroll transaction duration.
- Kafka consumer lag.
- Outbox pending records.
- Outbox publish duration.
- PostgreSQL query duration.
- MongoDB query duration.
- Redis latency.
- Error rate.

---

# Exit Criteria

Performance test execution is acceptable when:

- No data corruption occurs.
- No duplicate payroll transactions are created.
- No duplicate payslips are generated.
- Bottlenecks are documented.
- Metrics are captured and reviewed.

