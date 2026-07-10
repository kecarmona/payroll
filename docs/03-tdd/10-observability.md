# Technical Design Document

# Chapter 10

# Observability

Project

Distributed Payroll Processing Engine

---

# Purpose

This document defines how the platform exposes logs, metrics and traces.

Observability is required because payroll processing is distributed and asynchronous.

---

# Observability Goals

The system must answer:

- What happened to this payroll job?
- Which employee transaction failed?
- Which service processed this event?
- Why is a read model stale?
- Is Kafka lag increasing?
- Did an outbox event fail to publish?

---

# Correlation

Every request and event must carry:

- correlationId
- causationId
- companyId

Rules:

- HTTP requests create or accept correlationId.
- Events preserve correlationId.
- New events set causationId to the triggering eventId or requestId.

---

# Logging

Logs must be structured.

Required log fields:

- timestamp
- level
- service
- message
- companyId
- correlationId
- eventId
- payrollJobId
- errorCode

Sensitive data must not be logged.

---

# Metrics

Required metrics:

- HTTP request duration.
- HTTP error count.
- Kafka messages consumed.
- Kafka processing duration.
- Kafka consumer lag.
- Outbox pending records.
- Outbox publish failures.
- Payroll job duration.
- Payroll transaction failures.
- DLQ message count.

---

# Tracing

Distributed tracing should connect:

- Incoming HTTP command.
- Database transaction.
- Outbox insert.
- Outbox publish.
- Kafka consume.
- Projection update.
- Notification dispatch.

Trace spans should include safe business identifiers.

---

# Alerts

Initial alert candidates:

- DLQ count greater than zero.
- Outbox pending count continuously growing.
- Kafka consumer lag above threshold.
- Payroll job stuck in PROCESSING.
- Error rate above threshold.
- Database connection failures.

---

# Auditability

Audit logs are business records, not application logs.

Audit records must be:

- Immutable.
- Tenant-scoped.
- Correlated to events or commands.
- Searchable by companyId, actorId and entityId.

