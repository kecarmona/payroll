# Chaos Test Plan

Project

Distributed Payroll Processing Engine

---

# Purpose

Define controlled failure tests for validating resilience, recovery and data safety.

---

# Principles

- Break one dependency at a time.
- Preserve observability during failure.
- Validate recovery after dependency restoration.
- Never accept silent data loss.

---

# Failure Scenarios

## Kafka Unavailable

Action:

- Stop Kafka during outbox publishing.

Expected:

- Command-side database commits still succeed when appropriate.
- Outbox records remain pending.
- Publisher retries after Kafka returns.
- No events are lost.

---

## PostgreSQL Unavailable

Action:

- Stop PostgreSQL for Payroll Processing Service.

Expected:

- Consumers fail safely.
- Messages are retried.
- No event is acknowledged before durable processing.

---

## MongoDB Unavailable

Action:

- Stop MongoDB during projection updates.

Expected:

- Projection consumer retries.
- Command-side processing continues.
- Read models become stale but not corrupted.

---

## Redis Unavailable

Action:

- Stop Redis during idempotent command handling.

Expected:

- Critical commands fail closed or use persistent fallback if implemented.
- Duplicate processing is not allowed.

---

## Duplicate Kafka Messages

Action:

- Replay PayrollJobCreated.

Expected:

- No duplicate transactions.
- Consumer returns successful no-op for processed event.

---

## Consumer Crash

Action:

- Kill consumer after database commit and before acknowledgement.

Expected:

- Kafka redelivers message.
- Idempotency prevents duplicate state changes.
- Processing eventually succeeds.

---

# Required Evidence

Each chaos test records:

- Start time.
- Injected failure.
- Affected service.
- Expected behavior.
- Actual behavior.
- Recovery time.
- Data integrity result.
- Follow-up actions.

