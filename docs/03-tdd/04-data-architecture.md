# Technical Design Document

# Chapter 4

# Data Architecture

Project

Distributed Payroll Processing Engine

---

# Purpose

This document defines the persistence strategy, data ownership model and consistency boundaries for the platform.

---

# Data Ownership

Each service owns its database schema.

No service may directly read or write another service database.

Data integration occurs through:

- Public APIs for command validation when strictly necessary.
- Kafka integration events.
- CQRS projections.

---

# Persistence Technologies

PostgreSQL:

- Command-side persistence.
- Aggregate state.
- Transactional consistency.
- Outbox records.

MongoDB:

- Query-side read models.
- Dashboards.
- Search-oriented documents.
- Reporting views.

Redis:

- Idempotency cache.
- Short-lived locks when justified.
- Rate limiting counters.
- Temporary workflow metadata.

---

# PostgreSQL Per Service

Every command-side service receives its own PostgreSQL database or schema.

Expected ownership:

- Auth Service: users, credentials, refresh tokens.
- Employee Service: employees, salary records, employment status.
- Payroll Service: payroll periods, payroll jobs, outbox.
- Payroll Processing Service: payroll transactions, calculation results, payslips, outbox.
- Notification Service: notification records.
- Email Service: email delivery attempts.
- Audit Service: audit records.

---

# MongoDB Read Models

MongoDB stores denormalized projections.

Read models are disposable and rebuildable from events when possible.

Example collections:

- payroll_job_summary
- payroll_employee_summary
- payslip_search
- payroll_dashboard

Read models must include:

- companyId
- sourceEventId
- sourceEventVersion
- projectedAt
- correlationId

---

# Aggregate Versioning

Command-side aggregates include a numeric version.

Updates use optimistic locking.

Example:

```sql
UPDATE payroll_jobs
SET status = $1, version = version + 1
WHERE id = $2
AND version = $3;
```

If no row is affected, the application returns a concurrency conflict.

---

# Transactional Outbox Table

Services that publish events must persist events in an outbox table inside the same transaction as aggregate changes.

Required columns:

- id
- aggregateId
- aggregateType
- eventType
- eventVersion
- payload
- headers
- status
- createdAt
- publishedAt
- retryCount
- lastError

---

# Idempotency Store

Critical commands must support idempotency.

Required fields:

- key
- companyId
- requestHash
- responseBody
- status
- expiresAt
- createdAt

Rules:

- Same key and same request hash returns the original response.
- Same key and different request hash returns conflict.
- Expired keys may be removed by background cleanup.

---

# Multi-Tenancy

All business data must include companyId.

Every query must be scoped by companyId unless explicitly administrative.

Database indexes must prioritize companyId for tenant isolation and performance.

---

# Data Consistency

Strong consistency is required inside a single aggregate transaction.

Eventual consistency is accepted across services and read models.

The platform must prefer explicit state transitions over implicit side effects.

---

# Migrations

Database changes must be versioned.

Migration rules:

- Migrations are forward-only.
- Destructive changes require an ADR.
- Schema changes must be compatible with rolling deployment.
- Event schema changes must support old consumers during transition.

