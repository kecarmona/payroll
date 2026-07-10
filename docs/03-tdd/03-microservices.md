# Technical Design Document

# Chapter 3

# Microservices

Project

Distributed Payroll Processing Engine

---

# Purpose

This document defines the service boundaries, ownership model and communication responsibilities for the platform.

Each service maps to a bounded context and owns its domain model, persistence and integration contracts.

---

# Service Principles

- Services are independently deployable.
- Services own their databases.
- Services expose explicit APIs and events.
- Services do not share persistence tables.
- Cross-service workflows are asynchronous by default.
- Synchronous calls are allowed only for user-facing queries or authentication checks.

---

# Auth Service

Responsibilities:

- Authenticate users.
- Issue JWT access tokens.
- Issue and rotate refresh tokens.
- Enforce role-based access control.
- Own user credentials and sessions.

Primary roles:

- ADMIN
- HR
- EMPLOYEE

Owns:

- Users
- Credentials
- Refresh tokens
- Role assignments

Publishes:

- UserRegistered
- UserRoleChanged
- UserDisabled

---

# Employee Service

Responsibilities:

- Manage employee records.
- Manage employment status.
- Store salary information.
- Validate employee eligibility for payroll.

Owns:

- Employee profile
- Salary configuration
- Employment status
- Company membership

Publishes:

- EmployeeCreated
- EmployeeUpdated
- EmployeeSalaryChanged
- EmployeeTerminated

Consumes:

- UserRegistered

---

# Payroll Service

Responsibilities:

- Manage payroll periods.
- Create payroll jobs.
- Validate payroll execution requests.
- Orchestrate payroll workflows.

Important:

Payroll Service does not calculate individual employee payroll.

It creates the payroll workflow and emits events consumed by the processing engine.

Owns:

- PayrollPeriod
- PayrollJob

Publishes:

- PayrollJobCreated
- PayrollJobProcessingStarted
- PayrollJobCompleted
- PayrollJobFailed

Consumes:

- PayrollTransactionCompleted
- PayrollTransactionFailed

---

# Payroll Processing Service

Responsibilities:

- Consume payroll job events.
- Create payroll transactions per employee.
- Execute payroll calculations.
- Manage transaction state transitions.
- Retry recoverable failures.
- Enforce idempotency and optimistic locking.

Owns:

- PayrollTransaction
- PayrollCalculation
- Processing attempt metadata

Publishes:

- PayrollTransactionCreated
- PayrollTransactionProcessingStarted
- PayrollTransactionCompleted
- PayrollTransactionFailed
- PayslipGenerated

Consumes:

- PayrollJobCreated

---

# Payroll Projection Service

Responsibilities:

- Consume integration events.
- Build read models in MongoDB.
- Serve dashboard and reporting queries.

Owns:

- Payroll dashboard read models
- Employee payroll summary read models
- Payslip search read models

Consumes:

- PayrollJobCreated
- PayrollTransactionCompleted
- PayrollTransactionFailed
- PayslipGenerated

---

# Notification Service

Responsibilities:

- Receive notification requests.
- Select the delivery channel.
- Track notification lifecycle.

Publishes:

- EmailNotificationRequested
- NotificationFailed

Consumes:

- PayslipGenerated
- PayrollJobCompleted
- PayrollJobFailed

---

# Email Service

Responsibilities:

- Send emails.
- Track email delivery attempts.
- Isolate provider-specific email logic.

Publishes:

- EmailSent
- EmailFailed

Consumes:

- EmailNotificationRequested

---

# Audit Service

Responsibilities:

- Store immutable audit records.
- Preserve business traceability.
- Support investigation and compliance scenarios.

Consumes:

- All business-critical integration events.

Rules:

- Audit records are append-only.
- Audit events must preserve correlationId and causationId.
- Audit storage must not be modified by business services.

---

# Communication Rules

- Commands are handled by the owning service.
- Events are used to notify facts that already happened.
- Events must not expose internal persistence models.
- Event schemas are versioned.
- Consumers must be idempotent.
- Each service has its own consumer group.

---

# Failure Isolation

If one service fails:

- It must not corrupt another service database.
- Kafka messages must remain retryable.
- Failed messages must eventually move to a DLQ after retry exhaustion.
- The failed service must be restartable without manual data repair.

