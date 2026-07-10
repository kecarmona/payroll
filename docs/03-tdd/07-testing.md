# Technical Design Document

# Chapter 7

# Testing

Project

Distributed Payroll Processing Engine

---

# Purpose

This document defines the testing strategy for a distributed payroll platform.

Tests are part of the architecture, not an afterthought.

---

# Testing Pyramid

The platform uses:

- Unit tests for domain logic.
- Integration tests for adapters and persistence.
- Contract tests for service boundaries and events.
- E2E tests for complete workflows.
- Performance tests for scalability.
- Chaos tests for failure recovery.

---

# Unit Tests

Unit tests validate:

- Value objects.
- Aggregates.
- Domain services.
- State transitions.
- Business rules.

Rules:

- No database.
- No Kafka.
- No network.
- Fast and deterministic.

---

# Integration Tests

Integration tests validate:

- PostgreSQL repositories.
- MongoDB projections.
- Redis idempotency store.
- Kafka producers and consumers.
- Outbox publisher.

Use real infrastructure through Docker Compose or test containers.

---

# Contract Tests

Contract tests validate:

- HTTP request and response shapes.
- Event envelope compatibility.
- Event payload compatibility.
- Backward compatibility for event versions.

Breaking contract changes require an ADR.

---

# E2E Tests

E2E tests validate complete workflows.

Core scenario:

1. Create employee.
2. Create payroll period.
3. Create payroll job.
4. Publish PayrollJobCreated.
5. Process employee payroll transactions.
6. Generate payslips.
7. Update read models.
8. Send notifications.
9. Store audit records.

---

# Failure Tests

Failure scenarios:

- Kafka unavailable.
- PostgreSQL unavailable.
- MongoDB unavailable.
- Redis unavailable.
- Duplicate Kafka messages.
- Consumer crash after database commit.
- Outbox publisher crash after publish.
- Retry exhaustion.

Expected behavior:

- No duplicate payroll transactions.
- No partial job corruption.
- Failed transactions do not block successful employees.
- Messages are retryable or moved to DLQ.

---

# Test Data

Test data must include:

- Multiple companies.
- Multiple roles.
- Active employees.
- Terminated employees.
- Employees with salary changes.
- Duplicate payroll job requests.

---

# Definition of Done

A feature is complete only when:

- Specification exists.
- Acceptance criteria exist.
- Unit tests exist for domain rules.
- Integration tests exist for infrastructure adapters.
- E2E coverage exists for critical workflows.
- Documentation is updated.

