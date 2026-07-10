# AGENTS.md — Payroll Project Guide

Guide for AI agents working on the **Distributed Payroll Processing Engine**.

---

## 1. Source of Truth

All project documentation lives in **`docs/`**. Before implementing **anything**, the agent MUST consult the relevant docs.

### docs/ Structure

| Folder | Content | When to consult |
|---|---|---|
| `docs/00-vision/` | Project vision, philosophy | First contact with the project |
| `docs/01-prd/` | Product Requirements | Before any specification |
| `docs/02-architecture/` | Architecture overview, domain glossary | Designing any feature |
| `docs/03-tdd/` | Technical Design Documents (10 chapters) | **ALWAYS** before implementing |
| `docs/04-adr/` | Architecture Decision Records | When making an architecture decision |
| `docs/05-specs/` | Feature specifications | **Required** before coding |
| `docs/06-testing/` | Performance & chaos plans | Advanced testing |
| `docs/07-deployment/` | Docker and deployment | Infrastructure |
| `docs/08-observability/` | Monitoring | Observability |
| `docs/09-tracking/` | Implementation roadmap, task tracking | Planning |

### Golden Rule

> Never implement without reading the relevant docs first. If an ADR is missing, create it before coding.

---

## 2. SDD — Specification Driven Development

This project uses **SpecDD + strict TDD**. The pipeline is:

```
Specification → Acceptance Criteria → Tests → Implementation → Refactoring
```

### SDD Implementation

SDD changes are defined in **`openspec/changes/`** and follow this cycle:

1. **Proposal** — define the change scope
2. **Spec** — detailed specification with acceptance criteria
3. **Design** — technical design
4. **Tasks** — break down into implementation tasks
5. **Apply** — implement with TDD (tests first)
6. **Verify** — verify against the spec
7. **Archive** — close the change

### Implementation Roadmap

The complete roadmap is at:

📄 **`docs/09-tracking/implementation-roadmap.md`**

It contains **ALL SDD changes** to implement, in priority order, with:

- OpenSpec changes (e.g. `add-shared-kernel`, `add-auth-service`)
- Tasks per phase
- Exit criteria
- Dependencies between phases

**Reading this file is MANDATORY before planning any implementation.**

### Implementation Order (Summary)

| Phase | SDD Change | Services/Libs |
|---|---|---|
| 0-1 | `setup-monorepo`, `setup-local-infrastructure` | Base infrastructure |
| 2 | `add-shared-kernel` | `libs/shared-kernel` |
| 3 | `add-event-contracts`, `add-event-bus-abstractions` | `libs/contracts`, `libs/event-bus` |
| 4 | `add-service-foundation` | NestJS base patterns |
| 5 | `add-auth-service` | `auth-service` |
| 6 | `add-employee-service` | `employee-service` |
| 7-8 | `add-payroll-service`, `implement-create-payroll-job`, `add-transactional-outbox`, `add-kafka-publisher` | `payroll-service`, outbox |
| 9 | `add-payroll-processing-service`, `process-payroll-job`, `generate-payslip` | `payroll-processing-service` |
| 10 | `add-payroll-projection-service` | `payroll-projection-service` |
| 11 | `add-notification-service`, `add-email-service` | `notification-service`, `email-service` |
| 12 | `add-audit-service` | `audit-service` |
| 13-16 | Hardening, observability, E2E, performance | All |

---

## 3. Session Configuration

| Parameter | Value |
|---|---|
| **Execution mode** | `auto` (automatic with gatekeeper) |
| **Artifact store** | `hybrid` (OpenSpec files + Engram) |
| **Delivery strategy** | `single-pr-default` |
| **Review budget** | 800 lines |
| **TDD strict** | ✅ Enabled |

### Auto Mode

SDD phases run back-to-back with a **gatekeeper** that validates each phase before proceeding to the next. If the gatekeeper detects a problem, it stops the chain and requests intervention.

---

## 4. Architecture Overview

### Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js, TypeScript 5.4 |
| **Framework** | NestJS 10 |
| **Monorepo** | Nx 19.8 (pnpm 9.15) |
| **Write DB** | PostgreSQL (pg@8) |
| **Read DB** | MongoDB 6 |
| **Cache / Idempotency** | Redis 7 |
| **Messaging** | Apache Kafka (kafkajs@2.2) |

### Architectural Principles

- **Domain-Driven Design** — bounded contexts, aggregates, domain events
- **Clean / Hexagonal Architecture** — domain with zero infrastructure dependencies
- **CQRS** — write in PostgreSQL, read in MongoDB
- **Event-Driven Architecture** — Kafka as the backbone
- **Transactional Outbox** — events persisted in the same ACID transaction
- **Optimistic Locking** — `version` field on critical entities
- **Idempotency** — critical commands require `Idempotency-Key`
- **Database per Service** — never read another service's database directly

### Bounded Contexts

| Context | Service |
|---|---|
| Identity | `auth-service` |
| Employee | `employee-service` |
| Payroll | `payroll-service` |
| Processing | `payroll-processing-service` |
| Projections | `payroll-projection-service` |
| Notifications | `notification-service` |
| Email | `email-service` |
| Audit | `audit-service` |

### Processing Flow

```
HR creates Payroll Job
  → Payroll Service validates + persists (+ outbox)
    → Outbox Publisher publishes PayrollJobCreated to Kafka
      → Payroll Processing Service consumes and generates per-employee transactions
        → Results persisted in PostgreSQL
          → Projection Service updates MongoDB
            → Notification Service sends notifications
              → Audit Service records immutable events
```

---

## 5. Code Conventions

### Service Structure

Each service follows Clean/Hexagonal Architecture:

```
apps/<service>/
├── src/
│   ├── application/       # Use cases, commands, queries
│   ├── domain/            # Entities, value objects, domain events
│   ├── infrastructure/    # Repositories, adapters, DB
│   └── interface/         # Controllers, DTOs, guards
├── test/
│   ├── unit/
│   └── integration/
└── tsconfig.app.json
```

### Strict Rules

- **Do NOT create**: `utils/`, `helpers/`, `misc/`, `common/` without justification
- **Prefer**: `shared-kernel/` for truly shared domain concepts
- **Domain layer**: ZERO dependencies on NestJS or infrastructure
- **Events**: always go through the outbox, never publish directly to Kafka
- **Validation**: global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`
- **Testing**: tests written BEFORE production code

### Naming Conventions

- **Branches**: `feature/<change-name>`, `fix/<issue>`
- **Commits**: Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`)
- **Spec files**: `*.spec.ts` (Jest)
- **DTOs**: `CreateXDto`, `UpdateXDto`, `XResponseDto`

---

## 6. Testing

### Strict TDD

**`strict_tdd: true`** — No exceptions. Always:

```
Red (failing test) → Green (minimum to pass) → Refactor
```

### Testing Stack

| Type | Tool | Scope |
|---|---|---|
| Unit | Jest + ts-jest | Domain logic, value objects, entities |
| Integration | Jest + test containers | PostgreSQL, MongoDB, Kafka, Redis |
| E2E | Jest + supertest | Full cross-service flows |
| Contract | Jest | Event envelopes, DTOs |
| Load | k6 (future) | Scalability |
| Chaos | TBD | Controlled failures |

### Commands

```bash
pnpm test              # nx run-many -t test
pnpm lint              # nx run-many -t lint
pnpm build             # nx run-many -t build
pnpm format            # prettier --write .
docker compose up      # Local infrastructure
```

### Test Infrastructure

`libs/testing/` contains shared utilities (e.g. `TestCompanyId`).
It has no test target yet — needs expansion when required.

---

## 7. Project Health Check

### Current Status

| Aspect | Status |
|---|---|
| **Git init** | ❌ Not initialized |
| **CI pipeline** | ❌ Not configured |
| **Docker Compose** | ✅ Ready (PostgreSQL, MongoDB, Redis, Kafka + Kafka UI) |
| **Docker engine** | ✅ Running (Docker 29.1.3) |
| **Nx workspace** | ✅ Ready |
| **pnpm** | ✅ Available via npx (v9.15.4) — not installed globally |
| **Build** | ✅ **12/12 projects build successfully.** `event-bus` uses compiled declarations from `@payroll/contracts` via tsconfig paths override. |
| **Tests** | ❌ No test files exist anywhere — first TDD cycle pending |
| **Lint** | ✅ ESLint is configured (not tested yet) |

### Docker Compose

The `docker-compose.yml` at the project root defines 5 services: **PostgreSQL 16**, **MongoDB 7**, **Redis 7**, **Kafka 3.7** (KRaft mode, no Zookeeper), and **Kafka UI** on port 8080. All volumes are named. All services have health checks where appropriate. Ready to `docker compose up`.

### ⚠️ Known Build Issue (Resolved)

The `event-bus` library had a TypeScript `rootDir` conflict: it imported from `@payroll/contracts` but its `tsconfig.lib.json` only included its own `src/` directory, causing TS6059 errors.
**Fix**: The `event-bus/tsconfig.lib.json` now overrides `@payroll/contracts` path alias to point to the compiled declarations at `dist/libs/contracts/src/index` (relative to `baseUrl`).

### State by Component

| Component | State |
|---|---|
| Shared Kernel | ⏳ Scaffold (Entity, ValueObject, DomainEvent exist; AggregateRoot, Money, IDs missing) |
| Contracts | ⏳ Partial scaffold (EventEnvelope, PayrollEventType defined) |
| Event Bus | ⏳ Scaffold (ports exist, build fixed via declaration path) |
| Testing Lib | ⏳ Scaffold (no test target) |
| All services (8) | ⏳ Scaffold (app.module.ts, health.controller.ts, main.ts only) |
| Test files | ❌ Zero test files across the entire project |

---

## 8. First Steps for a New Agent

1. **Read** `docs/00-vision/vision.md` — understand the purpose
2. **Read** `docs/02-architecture/architecture-overview.md` — understand bounded contexts
3. **Read** `docs/09-tracking/implementation-roadmap.md` — see what's next
4. **Read** the relevant `docs/03-tdd/` chapter for the current phase
5. **Read** the relevant ADR if there are architectural questions
6. **Read** `docs/05-specs/` for the feature if applicable
7. **After all that**, start the SDD cycle

### If No Spec or ADR Exists for a Decision

> 1. Check if the roadmap covers it
> 2. If applicable, create a new ADR in `docs/04-adr/`
> 3. If it is a feature change, go through the full SDD cycle

---

## 9. Next Recommended SDD Change

Complete **`add-shared-kernel`** first:

- `AggregateRoot` base class
- `Money` value object
- `CompanyId` and other base ID value objects
- Domain error base classes
- Optimistic locking `version` support
- Unit tests for equality, domain event recording, Money invariants

This is the foundation everything else depends on.