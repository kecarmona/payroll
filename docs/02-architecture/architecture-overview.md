# Architecture Overview

**Project**

Distributed Payroll Processing Engine

---

# Purpose

This document provides a high-level architectural overview of the Distributed Payroll Processing Engine.

Its goal is to describe the system boundaries, bounded contexts, major services and communication patterns before diving into implementation details.

This document intentionally avoids low-level implementation decisions, which are covered by the Technical Design Document (TDD).

---

# Architectural Principles

The platform is built around the following principles:

- Domain-Driven Design (DDD)
- Event-Driven Architecture (EDA)
- Clean Architecture
- Hexagonal Architecture
- CQRS
- Specification-Driven Development
- Test-Driven Development
- Cloud-Native Design
- Horizontal Scalability
- High Availability
- Infrastructure as Code

---

# High-Level Architecture

```

```text
                         Client

                           │

                    API Gateway

                           │

        ┌──────────────────┼───────────────────┐

        │                  │                   │

        ▼                  ▼                   ▼

    Auth Service     Employee Service    Payroll Service

                                               │

                                       PayrollJobCreated

                                               │

                                            Kafka

                                               │

                                               ▼

                              Payroll Processing Service

                                               │

               ┌───────────────┼──────────────────────┐

               ▼               ▼                      ▼

          Audit Service   Notification         Projection

                              Service             Service

                                  │

                                  ▼

                            Email Service
```

```md

---

# Bounded Contexts

The system is divided into independent business domains.

Each bounded context owns its data, business rules and API.

---

## Identity Context

Responsible for:

- Authentication
- Authorization
- JWT
- Refresh Tokens
- User Roles

Microservice

- Auth Service

---

## Employee Context

Responsible for:

- Employees
- Salary Information
- Employment Status
- Company Membership

Microservice

- Employee Service

---

## Payroll Context

Responsible for:

- Payroll Periods
- Payroll Jobs
- Payroll Scheduling
- Payroll Validation

This context decides **when** payroll processing should start.

It never performs payroll calculations.

Microservice

- Payroll Service

---

## Payroll Processing Context

Responsible for:

- Distributed Processing
- Payroll Calculations
- Kafka Consumers
- Retry Policies
- Transaction States
- Outbox Publishing
- Idempotency
- Optimistic Locking

This context owns the processing engine.

Microservice

- Payroll Processing Service

---

## Notification Context

Responsible for:

- Notification orchestration

Supported channels:

- Email

Future:

- SMS
- Push
- Slack
- Teams

Microservice

- Notification Service

---

## Email Context

Responsible for:

- Email delivery

Microservice

- Email Service

---

## Audit Context

Responsible for storing immutable business events.

Every important business operation produces an audit event.

Microservice

- Audit Service

---

## Read Model Context

Responsible for building read projections.

Consumes Kafka events.

Produces optimized MongoDB documents.

Microservice

- Payroll Projection Service

---

# Data Ownership

Each service owns its own persistence.

No service is allowed to read another service's database directly.

Communication occurs only through:

- REST (commands)
- Kafka (events)

---

# CQRS

The platform separates commands from queries.

## Command Side

Responsible for:

- Business rules
- Validation
- Transactions
- Consistency

Primary database:

PostgreSQL

---

## Query Side

Responsible for:

- Dashboards
- Reports
- Search
- Historical queries

Primary database:

MongoDB

Read models are built asynchronously from Kafka events.

---

# Event-Driven Communication

Business events are the backbone of the system.

Examples:

- PayrollJobCreated
- PayrollProcessingStarted
- EmployeePayrollStarted
- EmployeePayrollCompleted
- EmployeePayrollFailed
- PayrollCompleted
- PayrollFailed
- PayslipGenerated
- EmailSent

All events must include:

- Event ID
- Correlation ID
- Timestamp
- Event Version
- Company ID

---

# Processing Flow

The processing lifecycle follows these steps:

1. HR creates Payroll Job
2. Payroll Service validates request
3. Payroll Job is persisted
4. Transactional Outbox stores event
5. Outbox Publisher publishes to Kafka
6. Payroll Processing Service consumes event
7. One payroll transaction is generated per employee
8. Processing results are persisted
9. Projection Service updates MongoDB
10. Notification Service sends notifications
11. Audit Service records immutable events

---

# Scalability Strategy

The platform is designed for horizontal scaling.

Scaling occurs at the consumer level.

Kafka partitions distribute employee payroll transactions across multiple instances of Payroll Processing Service.

Increasing processing capacity should only require deploying additional consumers.

---

# Consistency Strategy

Critical business operations rely on:

- ACID Transactions
- Transactional Outbox
- Optimistic Locking
- Idempotency Keys

Read models use Eventual Consistency.

---

# Multi-Tenancy

The platform is designed as a multi-tenant SaaS application.

Every domain entity belongs to a Company.

Tenant isolation is enforced throughout the entire platform.

---

# Security

Authentication

- JWT

Authorization

- RBAC

Critical commands require:

- Idempotency-Key
- Correlation ID

---

# Testing Strategy

Development follows:

Specification

↓

Acceptance Criteria

↓

Tests

↓

Implementation

↓

Refactoring

Testing includes:

- Unit Tests
- Integration Tests
- Contract Tests
- End-to-End Tests
- Load Tests
- Stress Tests
- Chaos Tests (future)

---

# Technology Stack

Backend

- NestJS
- TypeScript

Messaging

- Kafka

Databases

- PostgreSQL
- MongoDB
- Redis

Infrastructure

- Docker Compose

Architecture

- DDD
- CQRS
- Hexagonal
- Clean Architecture

Development

- SpecDD
- TDD