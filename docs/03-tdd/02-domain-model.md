# Technical Design Document

# Chapter 2

# Domain Model

Project

Distributed Payroll Processing Engine

---

# Purpose

This document defines the domain model of the platform.

The objective is to identify business concepts, consistency boundaries and ownership before discussing implementation details.

The model follows Domain-Driven Design (DDD).

Business terminology is defined in the Domain Glossary.

---

# Domain Overview

The platform is designed around one primary business capability:

Payroll Processing.

Payroll processing is decomposed into multiple bounded contexts, each responsible for a specific business capability.

Every bounded context owns:

- Business Rules
- Domain Model
- Persistence
- Events
- Public APIs

---

# Bounded Context Map

+-------------------+
| Identity          |
+-------------------+

            |

            ▼

+-------------------+
| Employee          |
+-------------------+

            |

            ▼

+-------------------+
| Payroll           |
+-------------------+

            |

     PayrollJobCreated

            |

            ▼

+---------------------------+
| Payroll Processing        |
+---------------------------+

      |         |         |

      ▼         ▼         ▼

 Audit     Notification   Projection

                      |

                      ▼

                   Email

---

# Aggregate Design

The system intentionally uses a small number of Aggregates.

Large aggregates reduce scalability.

Small aggregates improve concurrency.

---

## Company Aggregate

Represents a tenant.

Responsibilities:

- Tenant identity
- Tenant isolation

Root Entity

Company

---

## Employee Aggregate

Aggregate Root

Employee

Responsibilities

- Employee lifecycle
- Salary information
- Employment status

Invariants

- Employee belongs to one Company.
- Employee identifier is unique inside a Company.

---

## Payroll Aggregate

Aggregate Root

PayrollJob

Responsibilities

- Payroll orchestration
- Payroll lifecycle
- Payroll validation

Invariants

- One PayrollJob per Company and PayrollPeriod.
- Payroll cannot start twice.
- Payroll state transitions are valid.

Child Entities

None.

Payroll Transactions are NOT part of this Aggregate.

---

## Payroll Transaction Aggregate

Aggregate Root

PayrollTransaction

Responsibilities

- Process one Employee payroll.
- Retry handling.
- Failure isolation.
- State management.

Invariants

- One PayrollTransaction per Employee.
- Processing is idempotent.
- State transitions are valid.

---

## Payslip Aggregate

Aggregate Root

Payslip

Responsibilities

- Payroll result.

Invariant

Payslips are immutable.

Corrections generate new business operations.

---

# Aggregate Independence

PayrollJob never loads all PayrollTransactions.

Reason:

A PayrollJob may contain hundreds of thousands of PayrollTransactions.

Loading every transaction would destroy scalability.

Instead:

PayrollJob coordinates.

PayrollTransaction executes.

---

# Value Objects

The following concepts are immutable Value Objects.

---

Money

Represents monetary values.

Fields

- amount
- currency

Rules

- Immutable
- Precision-safe
- Currency aware

---

PayrollPeriod

Represents:

Year

Month

Rules

Immutable.

---

EmployeeId

Strongly typed identifier.

---

CompanyId

Tenant identifier.

---

PayrollJobId

Unique Payroll identifier.

---

PayrollTransactionId

Unique transaction identifier.

---

IdempotencyKey

Client-generated unique identifier.

---

CorrelationId

Workflow identifier.

Shared by every event produced during the same business process.

---

EmailAddress

Validated immutable email.

---

# Domain Services

Some business operations do not naturally belong to a single Aggregate.

These are implemented as Domain Services.

Examples

PayrollCalculationService

Responsible for conceptual payroll calculations.

---

PayrollValidationService

Responsible for validating payroll requests.

---

RetryPolicyService

Determines retry eligibility.

---

# Domain Events

Every significant business operation generates a Domain Event.

Examples

PayrollJobCreated

PayrollProcessingStarted

PayrollTransactionCreated

EmployeePayrollStarted

EmployeePayrollCompleted

EmployeePayrollFailed

PayrollCompleted

PayrollFailed

PayslipGenerated

NotificationRequested

EmailRequested

AuditRecorded

---

# Aggregate Lifecycle

PayrollJob

CREATED

↓

PROCESSING

↓

COMPLETED

or

FAILED

---

PayrollTransaction

PENDING

↓

PROCESSING

↓

COMPLETED

or

FAILED

---

# Optimistic Concurrency

Every Aggregate includes:

version

Each update validates the expected version.

Concurrent modifications result in:

409 Conflict

No distributed locking is required.

---

# Business Consistency

Consistency is guaranteed inside each Aggregate.

Communication between Aggregates occurs exclusively through Domain Events.

Cross-service consistency follows eventual consistency.

---

# Domain Rules

Rule 1

Only one PayrollJob exists for a Company and PayrollPeriod.

---

Rule 2

PayrollTransactions execute independently.

---

Rule 3

Failures never stop other PayrollTransactions.

---

Rule 4

Processing is idempotent.

---

Rule 5

Events are immutable.

---

Rule 6

Business rules execute before infrastructure concerns.

---

Rule 7

The Domain Layer has no dependencies on frameworks.

---

# Future Evolution

The domain model intentionally supports future capabilities such as:

- Bonuses
- Overtime
- Tax engines
- Benefits
- Multiple currencies
- Multiple payroll frequencies
- International payroll