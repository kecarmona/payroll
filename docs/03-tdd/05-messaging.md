# Technical Design Document

# Chapter 5

# Messaging

Project

Distributed Payroll Processing Engine

---

# Purpose

This document defines Kafka usage, event contracts, retry behavior and delivery guarantees.

---

# Messaging Principles

- Events describe business facts.
- Event names use past tense.
- Producers publish through the transactional outbox.
- Consumers are idempotent.
- Event contracts are versioned.
- Consumers must tolerate unknown fields.

---

# Event Envelope

Every event uses a common envelope:

```json
{
  "eventId": "uuid",
  "eventType": "PayrollJobCreated",
  "version": 1,
  "timestamp": "2026-01-01T00:00:00.000Z",
  "companyId": "uuid",
  "correlationId": "uuid",
  "causationId": "uuid",
  "producer": "payroll-service",
  "payload": {}
}
```

Required fields:

- eventId
- eventType
- version
- timestamp
- companyId
- correlationId
- causationId
- producer
- payload

---

# Topic Strategy

Initial topic model:

- payroll.events
- employee.events
- identity.events
- notification.events
- email.events
- audit.events

Topic partitioning key:

- companyId for tenant-ordered workflows.
- payrollJobId for payroll transaction processing when job-level ordering is required.

---

# Core Payroll Events

Payroll workflow events:

- PayrollJobCreated
- PayrollJobProcessingStarted
- PayrollTransactionCreated
- PayrollTransactionProcessingStarted
- PayrollTransactionCompleted
- PayrollTransactionFailed
- PayrollJobCompleted
- PayrollJobFailed
- PayslipGenerated

Notification events:

- NotificationRequested
- EmailNotificationRequested
- EmailSent
- EmailFailed

---

# Consumer Rules

Consumers must:

- Store processed event IDs.
- Treat duplicate events as successful no-ops.
- Validate event version.
- Reject malformed events.
- Emit audit events for important state transitions.

Consumers must not:

- Depend on producer database schemas.
- Assume exactly-once delivery from Kafka.
- Mutate state without idempotency protection.

---

# Retry Policy

Recommended retry tiers:

- Immediate retry for transient process errors.
- Delayed retry for infrastructure failures.
- DLQ after retry exhaustion.

Retry metadata:

- retryCount
- firstFailedAt
- lastFailedAt
- lastError
- nextRetryAt

---

# Dead Letter Queue

Each topic must have a DLQ equivalent.

Example:

- payroll.events.dlq
- notification.events.dlq

DLQ messages must preserve:

- Original event envelope.
- Consumer name.
- Failure reason.
- Stack trace when safe.
- Retry count.

---

# Schema Evolution

Allowed changes:

- Add optional fields.
- Add new event versions.
- Add new event types.

Risky changes:

- Rename fields.
- Remove fields.
- Change field meaning.

Breaking changes require:

- New event version.
- ADR.
- Migration plan.

---

# Ordering Guarantees

Kafka ordering is guaranteed only within a partition.

Business workflows must not rely on global ordering.

When ordering matters, partition by the business key that requires ordering.

---

# Observability

Every published and consumed event must log:

- eventId
- eventType
- companyId
- correlationId
- consumerGroup
- processingDurationMs
- outcome

