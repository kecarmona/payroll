# Chaos Tests Specification

## Purpose

Define controlled failure-injection tests that validate the payroll pipeline survives dependency outages without silent data loss, data corruption, or duplicate processing. Each test records evidence for post-mortem analysis.

## Requirements

### Requirement: Kafka Unavailable — Outbox Resilience

The outbox publisher MUST retain pending records when Kafka is unreachable and MUST deliver them after Kafka recovers. No payroll event MUST be lost.

#### Scenario: Kafka stop and recovery

- GIVEN a pending outbox record in the outbox table
- WHEN Kafka is stopped via `docker compose stop kafka`
- AND the outbox publisher executes its publish cycle
- THEN the outbox record remains pending with retryCount > 0
- WHEN Kafka is restarted via `docker compose start kafka`
- THEN the publisher delivers the event within the configured timeout
- AND all events reach Kafka without data loss

### Requirement: PostgreSQL Unavailable — Consumer Safe Failure

The processing consumer MUST fail safely when PostgreSQL is unreachable and MUST NOT commit a Kafka offset before durable storage completes.

#### Scenario: Postgres failure during processing

- GIVEN a PayrollJobCreated event being consumed
- WHEN PostgreSQL is stopped via `docker compose stop postgres`
- THEN the consumer operation fails with a transient error
- AND no Kafka offset is committed for the failed event
- WHEN PostgreSQL is restarted via `docker compose start postgres`
- THEN the consumer retries and processes the event successfully
- AND the event is durably persisted without data integrity violations

### Requirement: MongoDB Unavailable — Projection Retry

The projection consumer MUST retry when MongoDB is unreachable. Command-side processing MUST continue unaffected. Read models MAY become stale but MUST NOT become corrupted.

#### Scenario: MongoDB failure during projection

- GIVEN a projection consumer processing PayrollTransactionCompleted
- WHEN MongoDB is stopped via `docker compose stop mongodb`
- THEN the projection consumer fails with a connection error
- AND payroll-processing continues completing new transactions
- WHEN MongoDB is restarted via `docker compose start mongodb`
- THEN the projection consumer eventually applies the update
- AND no read-model documents are corrupted

### Requirement: Duplicate Kafka Message — Idempotent Consumption

The system MUST reject duplicate Kafka messages idempotently. Replaying an already-consumed event MUST NOT produce duplicate transactions or payslips.

#### Scenario: Replay of consumed PayrollJobCreated

- GIVEN a PayrollJobCreated event that was already processed
- WHEN the same event is published again (identical eventId)
- THEN the consumer returns without applying changes
- AND no duplicate payroll transactions are created
- AND no duplicate payslips are generated

### Requirement: Consumer Crash — Redelivery and Idempotency

The system MUST survive consumer crashes that occur after DB commit but before Kafka ack. Kafka MUST redeliver the message, and idempotency MUST prevent duplicate state changes.

#### Scenario: Consumer killed before offset commit

- GIVEN a consumer processing a payroll transaction event
- WHEN the consumer commits the transaction to PostgreSQL
- AND the consumer process is killed before Kafka acknowledges the offset
- THEN Kafka redelivers the message after consumer-group rebalance
- WHEN the redelivered message is consumed
- THEN the idempotency check detects it as already-processed
- AND no duplicate state changes occur
- AND the transaction eventually reaches a terminal state

### Requirement: Evidence Logging

Each chaos test MUST record start time, injected failure, affected service, expected vs actual behavior, recovery time, and data integrity result.

#### Scenario: Full evidence output

- GIVEN a chaos test scenario executing
- WHEN the test completes
- THEN the output includes: start timestamp, injected failure description, affected service, expected behavior, actual behavior, recovery duration, and data integrity verdict
- AND any follow-up actions are documented
