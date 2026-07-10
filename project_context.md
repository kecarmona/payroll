---

# Distributed Payroll Processing Engine

**Project Motto**

> Process once. Scale infinitely. Audit everything.

---

# 1. Project Vision

Build a production-grade distributed payroll processing engine focused on demonstrating modern backend architecture.

The objective is NOT to replicate a complete HRIS platform.

The objective is to demonstrate how a large-scale enterprise system handles:

* High-volume transactional processing.
* Concurrent operations.
* Distributed workflows.
* Event-driven communication.
* Data consistency.
* Failure recovery.
* Auditability.

The project simulates a SaaS payroll platform similar in nature to enterprise HR platforms.

---

# 2. Development Philosophy

The project follows:

## Specification Driven Development (SpecDD)

The specification is the source of truth.

Flow:

```
Specification

↓

Acceptance Criteria

↓

Tests

↓

Implementation

↓

Refactoring

↓

Documentation
```

No feature should be implemented without a specification.

---

## Test Driven Development (TDD)

Implementation follows:

```
Red

↓

Green

↓

Refactor
```

Tests are written before production code.

---

# 3. Core Architectural Principles

The system must follow:

* Domain Driven Design (DDD)
* Clean Architecture
* Hexagonal Architecture
* CQRS
* Event Driven Architecture
* Microservices
* Database per Service
* Transactional Outbox
* Optimistic Locking
* Idempotency
* Horizontal Scalability

---

# 4. Technology Stack

## Backend

* TypeScript
* NestJS

## Monorepo

Recommended:

* Nx

## Messaging

* Apache Kafka

Running locally with:

* Docker Compose

## Databases

Write side:

* PostgreSQL

Read side:

* MongoDB

Caching / idempotency:

* Redis

All infrastructure must run locally using Docker.

A developer should be able to:

```bash
docker compose up
```

and start the complete environment.

---

# 5. High-Level Architecture

The system is divided into bounded contexts.

Each bounded context becomes an independently deployable service.

---

# 6. Microservices

## Auth Service

Responsibilities:

* Authentication
* JWT generation
* Refresh tokens
* RBAC

Roles:

```
ADMIN

HR

EMPLOYEE
```

---

# Employee Service

Responsibilities:

* Employee management
* Employee information
* Salary information
* Employment status

Own database.

---

# Payroll Service

Responsibilities:

* Payroll periods
* Payroll jobs
* Payroll orchestration
* Payroll validation

Important:

Payroll Service DOES NOT process payroll.

It creates the workflow.

Example:

```
Create Payroll Job

↓

Publish PayrollJobCreated
```

---

# Payroll Processing Service

This is the core engine.

Responsibilities:

* Consume Kafka events
* Create Payroll Transactions
* Execute payroll calculations
* Manage processing states
* Retry failures
* Handle idempotency
* Optimistic locking

---

# Notification Service

Responsibilities:

* Receive notification events
* Decide notification channel

---

# Email Service

Responsibilities:

* Send emails

---

# Audit Service

Responsibilities:

Store immutable audit records.

Everything important generates an audit event.

---

# Payroll Projection Service

CQRS read side.

Consumes Kafka events.

Builds MongoDB read models.

---

# 7. Domain Model

Main entities:

---

## Company

Tenant.

Everything belongs to a company.

Every entity requires:

```
companyId
```

---

## Employee

Represents a worker.

---

## PayrollPeriod

Example:

```
January 2026
```

---

## PayrollJob

Represents a complete payroll execution.

States:

```
CREATED

PROCESSING

COMPLETED

FAILED
```

Rules:

* Only one PayrollJob per company and period.
* Must be idempotent.

---

## PayrollTransaction

Represents one employee payroll execution.

States:

```
PENDING

PROCESSING

COMPLETED

FAILED
```

Rules:

* One transaction per employee.
* Failure does not affect others.

---

## Payslip

Final payroll result.

Immutable.

---

# 8. CQRS Design

Command Side:

PostgreSQL.

Responsible for:

* Business rules
* Transactions
* Consistency

Query Side:

MongoDB.

Responsible for:

* Dashboards
* Reports
* Searches

Flow:

```
Command

↓

PostgreSQL

↓

Domain Event

↓

Kafka

↓

Projection Service

↓

MongoDB
```

---

# 9. Kafka Design

Kafka is the event backbone.

Events should represent business facts.

Examples:

```
PayrollJobCreated

PayrollProcessingStarted

PayrollTransactionCreated

EmployeePayrollCompleted

EmployeePayrollFailed

PayrollCompleted

PayrollFailed

PayslipGenerated

NotificationRequested

EmailSent
```

Every event requires:

```
eventId

eventType

version

timestamp

companyId

correlationId

payload
```

---

# 10. Transactional Outbox

Mandatory.

Never do:

```
Database Commit

↓

Kafka Publish
```

because it can fail.

Required flow:

```
PostgreSQL Transaction

        |

        |

Payroll Data

+

Outbox Event

        |

        |

Commit

        |

        |

Outbox Publisher

        |

        |

Kafka
```

---

# 11. Idempotency

Mandatory for critical commands.

Frontend/client sends:

```
Idempotency-Key
```

Example:

```
POST /payroll/process

Headers:

Idempotency-Key:
abc123
```

System stores:

Entity:

```
IdempotencyRequest
```

Contains:

```
key

requestHash

response

status

expiration
```

Repeated requests return the original result.

---

# 12. Optimistic Locking

Entities require:

```
version
```

Example:

Database:

```
PayrollJob

id

status

version=3
```

Update:

```
WHERE id=x

AND version=3
```

If affected rows = 0:

return:

```
409 Conflict
```

---

# 13. Testing Strategy

Testing is a first-class feature.

Must include:

---

## Unit Tests

Domain logic.

---

## Integration Tests

Real:

* PostgreSQL
* MongoDB
* Redis
* Kafka

---

## E2E Tests

Full workflow.

Example:

```
Create Payroll

↓

Kafka

↓

Process Employees

↓

Generate Payslip

↓

Send Email
```

---

## Performance Tests

Include:

* Load testing
* Stress testing
* Spike testing
* Soak testing

---

## Failure Testing

Break the system intentionally:

* Kafka unavailable
* Database unavailable
* Duplicate messages
* Consumer crash
* Network delay
* Retry exhaustion

---

# 14. Security

Implement:

* JWT authentication
* RBAC
* Validation pipes
* Rate limiting
* Secure headers
* Input sanitization

Test:

* Unauthorized access
* SQL injection attempts
* Invalid payloads
* Replay attacks

---

# 15. Documentation Required

Final repository must contain:

```
docs/

00-vision/

vision.md


01-prd/

prd.md


02-architecture/

architecture-overview.md

domain-glossary.md


03-tdd/

01-system-overview.md

02-domain-model.md

03-microservices.md

04-data-architecture.md

05-messaging.md

06-security.md

07-testing.md

08-performance.md

09-deployment.md

10-observability.md


04-adr/

ADR files


05-specs/

feature specifications


06-testing/

performance plans

chaos plans


07-deployment/

docker documentation


08-observability/

future monitoring docs
```

---

# 16. Implementation Rules

## Do NOT create:

```
utils/

helpers/

misc/

common/
```

unless justified.

---

## Prefer:

```
shared-kernel/
```

Only for true shared domain concepts:

Example:

```
Money

CompanyId

Entity

ValueObject

DomainEvent
```

---

# 17. Expected Repository Structure

Recommended:

```
apps/

auth-service

employee-service

payroll-service

payroll-processing-service

notification-service

email-service

audit-service

projection-service


libs/

shared-kernel

contracts

event-bus

testing
```

---

# 18. First Implementation Milestone

Codex should implement in this order:

## Phase 1

Infrastructure:

* Nx
* Docker Compose
* PostgreSQL
* MongoDB
* Redis
* Kafka

## Phase 2

Shared Kernel:

* Entity
* AggregateRoot
* ValueObject
* DomainEvent
* IDs

## Phase 3

Auth Service

## Phase 4

Employee Service

## Phase 5

Payroll Service

## Phase 6

Kafka + Outbox

## Phase 7

Payroll Processing Service

## Phase 8

CQRS Projection Service

## Phase 9

Notification + Email

## Phase 10

Testing + Performance

---

# Final Instruction To Codex

You are implementing a production-grade distributed payroll processing platform.

Do not optimize for speed of implementation.

Optimize for:

* maintainability
* correctness
* scalability
* testability
* architectural clarity

Every technical decision must align with the documented architecture.

When uncertain:

1. Check the specification.
2. Check the TDD.
3. Check the ADRs.
4. If no decision exists, create an ADR before implementing.

The goal is not only working software.

The goal is demonstrating how a senior engineer designs and builds a distributed enterprise system.

---

Con este documento, Codex ya tiene el **contexto completo del proyecto**. Mi recomendación es que lo pegues como `PROJECT_CONTEXT.md` en la raíz del repositorio y que cualquier tarea que le des a Codex empiece con:

> "Follow PROJECT_CONTEXT.md and implement according to the architecture decisions."

Así mantenemos la misma línea arquitectónica durante toda la implementación.
