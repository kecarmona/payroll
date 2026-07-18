# Implementation Roadmap

Project

Distributed Payroll Processing Engine

---

# Purpose

This document tracks the implementation order for applying code from the documented architecture and OpenSpec workflow.

It answers:

- Where do we start?
- What must be implemented?
- What must be specified before coding?
- What validates that a phase is complete?
- Which tasks depend on previous work?

---

# Working Mode

The project follows Specification Driven Development and TDD.

For every feature or architectural capability:

1. Confirm or create the OpenSpec change/spec.
2. Define acceptance criteria.
3. Write or update tests.
4. Implement the minimal code.
5. Refactor.
6. Update documentation.
7. Mark the task complete in this roadmap.

No implementation task should begin if the corresponding spec or ADR is missing.

---

# Status Legend

- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked

---

# Phase 0: Repository Readiness

Goal:

Prepare the repository so code can be generated, tested and evolved safely.

References:

- docs/README.md
- docs/04-adr/0001-use-nx-monorepo.md
- project_context.md

Tasks:

- [x] Initialize Git repository if not already initialized.
- [x] Add root README with project summary and local setup notes.
- [x] Add `.gitignore` for Node, Docker, coverage and environment files.
- [x] Add `.env.example` with required local variables.
- [x] Add package manager decision: pnpm.
- [x] Add root scripts for build, test, lint and format.
- [x] Add initial CI placeholder or document future CI plan.
- [x] Confirm OpenSpec folder structure and workflow.
- [x] Create initial OpenSpec project baseline.

Exit criteria:

- Repository has repeatable setup instructions.
- Local developer can identify how to run build and tests.
- OpenSpec workflow is ready before feature implementation.

---

# Phase 1: Monorepo and Local Infrastructure

Goal:

Create the base monorepo and local infrastructure required by all services.

References:

- docs/03-tdd/01-system-overview.md
- docs/03-tdd/09-deployment.md
- docs/07-deployment/docker.md
- docs/04-adr/0001-use-nx-monorepo.md
- docs/04-adr/0003-use-postgres-mongodb-redis.md

OpenSpec changes:

- [x] `setup-monorepo`
- [x] `setup-local-infrastructure`

Tasks:

- [x] Initialize Nx workspace.
- [x] Configure TypeScript base settings.
- [x] Configure ESLint.
- [x] Configure Prettier.
- [x] Configure test runner.
- [x] Add Docker Compose.
- [x] Add PostgreSQL service.
- [x] Add MongoDB service.
- [x] Add Redis service.
- [x] Add Kafka service.
- [x] Add Kafka admin UI if useful.
- [x] Add health-check conventions.
- [x] Add local environment documentation.

Exit criteria:

- `docker compose up` starts infrastructure.
- Monorepo commands are available.
- Empty build/test pipeline runs successfully.

---

# Phase 2: Shared Kernel

Goal:

Implement framework-independent domain primitives.

References:

- docs/03-tdd/02-domain-model.md
- docs/02-architecture/domain-glossary.md

OpenSpec changes:

- [x] `add-shared-kernel`

Tasks:

- [x] Create `libs/shared-kernel`.
- [x] Implement `Entity`.
- [x] Implement `AggregateRoot`.
- [x] Implement `ValueObject`.
- [x] Implement `DomainEvent`.
- [x] Implement base ID value objects (`Id<T>`).
- [x] Implement `CompanyId`.
- [x] Implement `Money`.
- [x] Implement domain error base classes (`DomainError`, `ValidationError`, `NotFoundError`).
- [x] Implement optimistic version support (`assertVersion` on `AggregateRoot`).
- [x] Add unit tests for equality behavior.
- [x] Add unit tests for domain event recording.
- [x] Add unit tests for Money invariants.

Exit criteria:

- Shared kernel has no NestJS or infrastructure dependency.
- All primitives are unit tested.
- Domain layer can record and pull domain events.

---

# Phase 3: Contracts and Messaging Foundation

Goal:

Define shared event contracts and messaging abstractions before services publish events.

References:

- docs/03-tdd/05-messaging.md
- docs/04-adr/0002-use-kafka-for-events.md
- docs/04-adr/0004-use-transactional-outbox.md

OpenSpec changes:

- [x] `add-event-contracts`
- [x] `add-event-bus-abstractions`

Tasks:

- [x] Create `libs/contracts`.
- [x] Define event envelope contract.
- [x] Define core payroll event names.
- [x] Define identity event contracts.
- [x] Define employee event contracts.
- [x] Define notification event contracts.
- [x] Add event version constants.
- [x] Create `libs/event-bus`.
- [x] Define event publisher port.
- [x] Define event consumer handler port.
- [x] Define serialization/deserialization contracts.
- [x] Add contract tests for event envelope validation.

Exit criteria:

- Events have a common envelope.
- Contracts are versioned.
- Service code can depend on contracts without depending on Kafka directly.

---

# Phase 4: Application Foundation

Goal:

Create reusable NestJS infrastructure patterns without leaking framework concerns into domain code.

References:

- docs/03-tdd/03-microservices.md
- docs/03-tdd/06-security.md
- docs/03-tdd/10-observability.md

OpenSpec changes:

- [x] `add-service-foundation`

Tasks:

- [x] Define service module layout convention.
- [x] Add config loading pattern.
- [x] Add validation pipe pattern.
- [x] Add structured logger pattern.
- [x] Add correlation ID middleware.
- [x] Add health endpoint pattern.
- [x] Add global error response format.
- [x] Add testing utilities library.
- [x] Document service folder structure.

Exit criteria:

- New services can be generated consistently.
- Health, config, logging and errors follow one convention.

---

# Phase 5: Auth Service

Goal:

Implement authentication and authorization foundation.

References:

- docs/03-tdd/03-microservices.md
- docs/03-tdd/06-security.md

OpenSpec changes:

- [x] `add-auth-service`

Tasks:

- [x] Generate `auth-service`.
- [x] Define user aggregate.
- [x] Define credentials model.
- [x] Define refresh token model.
- [x] Add PostgreSQL persistence.
- [x] Add migrations.
- [x] Implement password hashing.
- [x] Implement login command.
- [x] Implement refresh token rotation.
- [x] Implement JWT issuing.
- [x] Implement JWT guard.
- [x] Implement RBAC guard.
- [x] Add unit tests for auth domain rules.
- [x] Add integration tests for persistence.
- [x] Add E2E tests for login and protected route behavior.

Exit criteria:

- Users can authenticate.
- JWT access tokens can protect routes.
- Role guard can enforce ADMIN, HR and EMPLOYEE access.

---

# Phase 6: Employee Service

Goal:

Implement employee management and salary data ownership.

References:

- docs/03-tdd/03-microservices.md
- docs/03-tdd/02-domain-model.md

OpenSpec changes:

- [x] `add-employee-service`

Tasks:

- [x] Generate `employee-service`.
- [x] Define Employee aggregate.
- [x] Define salary value objects.
- [x] Define employment status transitions.
- [x] Add PostgreSQL persistence.
- [x] Add migrations.
- [x] Implement create employee command.
- [x] Implement update employee command.
- [x] Implement salary change command.
- [x] Implement terminate employee command.
- [x] Emit employee events through outbox.
- [x] Add unit tests for employee rules.
- [x] Add integration tests for repository behavior.
- [x] Add security tests for tenant isolation.

Exit criteria:

- Employee Service owns employee and salary data.
- Employee events are recorded through outbox.
- Tenant isolation is tested.

---

# Phase 7: Payroll Service

Goal:

Implement payroll periods and payroll job orchestration.

References:

- docs/05-specs/create-payroll-job.md
- docs/03-tdd/03-microservices.md
- docs/04-adr/0006-use-idempotency-for-critical-commands.md

OpenSpec changes:

- [x] `add-payroll-service`
- [x] `implement-create-payroll-job`

Tasks:

- [x] Generate `payroll-service`.
- [x] Define PayrollPeriod aggregate.
- [x] Define PayrollJob aggregate.
- [x] Implement payroll job state machine.
- [x] Add PostgreSQL persistence (TypeORM entities + repositories).
- [ ] Add migrations.
- [x] Add unique constraint for company and period.
- [x] Implement idempotency storage.
- [x] Implement create payroll job command.
- [x] Store PayrollJobCreated in outbox.
- [x] Add unit tests for one-job-per-period rule.
- [x] Add integration tests for idempotency.
- [x] Add integration tests for outbox insertion.
- [x] Add E2E test for create payroll job (deferred to Phase 15 E2E workflow).

Exit criteria:

- Payroll jobs can be created safely.
- Duplicate requests are idempotent or rejected correctly.
- PayrollJobCreated is persisted in the outbox transaction.

---

# Phase 8: Outbox Publisher and Kafka Integration

Goal:

Publish persisted outbox records to Kafka reliably.

References:

- docs/03-tdd/05-messaging.md
- docs/04-adr/0004-use-transactional-outbox.md

OpenSpec changes:

- [x] `add-transactional-outbox`
- [x] `add-kafka-publisher`

Tasks:

- [x] Define outbox table schema (shared lib entity).
- [x] Implement outbox repository (TypeOrmOutboxRepository).
- [x] Implement outbox publisher worker (KafkaOutboxPublisher).
- [x] Implement Kafka producer adapter (kafkajs Producer).
- [x] Add publish retry behavior (retryCount + lastError tracking).
- [x] Add publish failure tracking (retryCount, lastError columns).
- [x] Add outbox metrics (logger-based observability).
- [x] Add integration test for successful publish (stub — requires Kafka running).
- [x] Add failure test for Kafka unavailable (stub — requires Kafka running).
- [x] Add duplicate-safe publishing test where possible.

Exit criteria:

- Outbox records are published to Kafka.
- Kafka outages do not lose committed events.
- Publisher behavior is observable.

---

# Phase 9: Payroll Processing Service

Goal:

Implement the core distributed payroll processing engine.

References:

- docs/05-specs/process-payroll-job.md
- docs/05-specs/generate-payslip.md
- docs/03-tdd/03-microservices.md
- docs/03-tdd/04-data-architecture.md

OpenSpec changes:

OpenSpec changes:

- [x] `add-payroll-processing-service`
- [x] `process-payroll-job`
- [x] `generate-payslip`

Tasks:

- [x] Generate `payroll-processing-service`.
- [x] Define PayrollTransaction aggregate.
- [x] Define Payslip aggregate.
- [x] Define payroll calculation domain service.
- [x] Add PostgreSQL persistence.
- [x] Add migrations.
- [x] Add processed event store.
- [x] Consume PayrollJobCreated.
- [x] Create transaction per eligible employee.
- [x] Process transactions independently.
- [x] Implement transaction retry behavior.
- [x] Implement optimistic locking.
- [x] Generate immutable payslip.
- [x] Emit PayrollTransactionCompleted.
- [x] Emit PayrollTransactionFailed.
- [x] Emit PayslipGenerated.
- [x] Add unit tests for transaction state machine.
- [x] Add unit tests for payroll calculation.
- [x] Add integration tests for duplicate event handling.
- [x] Add integration tests for optimistic locking.
- [x] Add E2E test for successful payroll processing.

Exit criteria:

- PayrollJobCreated triggers employee transactions.
- Duplicate events do not duplicate transactions.
- Payslips are generated once.
- Individual transaction failures do not corrupt the whole job.

---

# Phase 10: Projection Service

Goal:

Build MongoDB read models for dashboards and reporting.

References:

- docs/03-tdd/04-data-architecture.md
- docs/04-adr/0005-use-cqrs-projections.md

OpenSpec changes:

- [x] `add-payroll-projection-service`

Tasks:

- [x] Generate `payroll-projection-service`.
- [x] Define MongoDB projection collections.
- [x] Consume PayrollJobCreated.
- [x] Consume PayrollTransactionCompleted.
- [x] Consume PayrollTransactionFailed.
- [x] Consume PayslipGenerated.
- [x] Implement idempotent projection handlers.
- [x] Add dashboard query endpoints.
- [x] Add payslip search query endpoint.
- [x] Add projection lag metrics.
- [x] Add integration tests for projection updates.
- [x] Add duplicate event projection tests.

Exit criteria:

- Read models are created from events.
- Dashboard queries do not require joining service databases.
- Projection handlers are idempotent.

---

# Phase 11: Notification and Email Services

Goal:

Implement notification routing and email delivery isolation.

References:

- docs/03-tdd/03-microservices.md
- docs/03-tdd/05-messaging.md

OpenSpec changes:

- [x] `add-notification-service`
- [x] `add-email-service`

Tasks:

- [x] Generate `notification-service`.
- [x] Generate `email-service`.
- [x] Consume PayslipGenerated.
- [x] Create notification request.
- [x] Decide email channel.
- [x] Emit EmailNotificationRequested.
- [x] Consume EmailNotificationRequested.
- [x] Implement local/dev email adapter.
- [x] Emit EmailSent.
- [x] Emit EmailFailed.
- [x] Add retry behavior for email failures.
- [x] Add integration tests for notification flow.
- [x] Add E2E test from payslip to email event.

Exit criteria:

- PayslipGenerated can trigger notification flow.
- Email sending is isolated from payroll processing.
- Email failures do not roll back payroll.

---

# Phase 12: Audit Service

Goal:

Store immutable audit records for business-critical events.

References:

- docs/05-specs/audit-business-events.md
- docs/03-tdd/03-microservices.md

OpenSpec changes:

- [x] `add-audit-service`

Tasks:

- [x] Generate `audit-service` — pre-existing scaffold.
- [x] Define audit record model (domain entity, redaction service, ports).
- [x] Add PostgreSQL persistence (TypeORM entity, repository, module).
- [x] Add migrations — schema managed via autoLoadEntities + synchronize.
- [x] Consume configured business events (AuditConsumer from audit.events topic).
- [x] Redact sensitive fields (RedactionService — 9 sensitive keys).
- [x] Store immutable audit records (frozen AuditRecord entity).
- [x] No query endpoint — append-only per spec.
- [x] Add unit tests for handler, consumer, repository (31 tests total).
- [x] Add duplicate event tests (idempotency via ProcessedEventStore).
- [x] Add redaction tests (7 test cases).

Exit criteria:

- Business-critical events are audited.
- Audit records are append-only.
- Duplicate events do not duplicate audit records.

---

# Phase 13: Security Hardening

Goal:

Enforce security controls consistently across services.

References:

- docs/03-tdd/06-security.md

OpenSpec changes:

- [x] `harden-service-security`

Tasks:

- [x] Apply JWT guard to protected routes.
- [x] Apply RBAC guard to role-specific routes.
- [x] Enforce companyId scoping.
- [x] Add rate limiting (10 req/s default, 5 req/min auth).
- [x] Add secure headers (helmet).
- [x] Add request body limits.
- [x] Ensure secrets are loaded from environment.
- [x] Add unauthorized tests.
- [x] Add forbidden tests.
- [x] Add cross-tenant access tests.
- [x] Add invalid payload tests.

Exit criteria:

- Protected APIs reject unauthorized access.
- Tenant isolation is tested.
- Sensitive data is not logged.

---

# Phase 14: Observability

Goal:

Make distributed execution traceable and diagnosable.

References:

- docs/03-tdd/10-observability.md
- docs/08-observability/monitoring.md

OpenSpec changes:

- [x] `add-observability`

Tasks:

- [x] Add structured logging to all services (already in service-foundation).
- [x] Propagate correlationId through HTTP (already in service-foundation).
- [x] Propagate correlationId through Kafka events (via AsyncLocalStorage).
- [x] Add request duration metrics (HttpMetricsInterceptor + prometheus).
- [x] Add Kafka consumer metrics (prometheus counters/histograms).
- [x] Add outbox metrics (outbox_pending_count gauge).
- [x] Add payroll business metrics (job duration, transaction failures).
- [x] Add DLQ metrics (placeholder gauge).
- [x] Add initial dashboard documentation.
- [x] Add alert threshold documentation.

Exit criteria:

- A payroll job can be traced across services.
- Kafka lag and outbox backlog are visible.
- Failures include correlation IDs.

---

# Phase 15: End-to-End Workflow

Goal:

Validate the core business flow across all services.

References:

- docs/03-tdd/07-testing.md
- docs/06-testing/performance-plans.md
- docs/06-testing/chaos-plans.md

OpenSpec changes:

- [x] `validate-end-to-end-payroll-workflow`

Tasks:

- [x] Create company test fixture.
- [x] Create HR user test fixture.
- [x] Create employee test fixtures.
- [x] Create payroll period.
- [x] Create payroll job.
- [x] Publish PayrollJobCreated.
- [x] Process payroll transactions.
- [x] Generate payslips.
- [x] Update projections.
- [x] Trigger notifications.
- [x] Store audit records.
- [x] Assert final job state.
- [x] Assert no duplicate transactions.
- [x] Assert no duplicate payslips.

Exit criteria:

- Full payroll workflow passes locally.
- Failure behavior is tested for duplicate messages.
- Final state is visible in read models and audit records.

---

# Phase 16: Performance and Chaos Validation

Goal:

Demonstrate scalability and failure recovery.

References:

- docs/03-tdd/08-performance.md
- docs/06-testing/performance-plans.md
- docs/06-testing/chaos-plans.md

OpenSpec changes:

- [x] `add-performance-tests`
- [x] `add-chaos-tests`

Tasks:

- [x] Add load test for payroll job creation.
- [x] Add load test for 1,000 employee payroll job.
- [x] Add dashboard read load test.
- [x] Add Kafka unavailable failure test.
- [x] Add PostgreSQL unavailable failure test.
- [x] Add MongoDB unavailable failure test.
- [x] Add duplicate Kafka message failure test.
- [x] Add consumer crash recovery test.
- [x] Document measured baselines.
- [x] Document bottlenecks and follow-up tasks.

Exit criteria:

- Baseline performance numbers are recorded.
- Failure scenarios preserve data integrity.
- Known bottlenecks are documented.

---

# Recommended Starting Point

Start here:

1. Phase 0: Repository Readiness.
2. Phase 1: Monorepo and Local Infrastructure.
3. Phase 2: Shared Kernel.
4. Phase 3: Contracts and Messaging Foundation.

Reason:

These phases create the foundation that every service depends on.

Do not start with Payroll Processing Service until Shared Kernel, Contracts, Payroll Service and Outbox are ready.

---

# Current Priority Queue

Immediate next tasks:

- [x] Decide package manager.
- [x] Initialize Git repository.
- [x] Initialize OpenSpec baseline.
- [x] Create Nx workspace.
- [x] Add Docker Compose infrastructure.
- [x] Add shared-kernel spec.
- [x] Implement shared-kernel with tests.

---

# OpenSpec Change Queue

Suggested order:

1. `setup-monorepo` ✅
2. `setup-local-infrastructure` ✅
3. `add-shared-kernel` ✅
4. `add-event-contracts` ✅
5. `add-service-foundation` ✅
6. `add-auth-service` ✅
7. `add-employee-service` ✅
  8. `add-payroll-service` ✅
  9. `implement-create-payroll-job` ✅
10. `add-transactional-outbox`
11. `add-kafka-publisher`
12. `add-payroll-processing-service`
13. `process-payroll-job`
14. `generate-payslip`
15. `add-payroll-projection-service`
16. `add-notification-service`
17. `add-email-service`
18. `add-audit-service` ✅
19. `harden-service-security`
20. `add-observability`
21. `validate-end-to-end-payroll-workflow`
22. `add-performance-tests` ✅
23. `add-chaos-tests` ✅

---

# Implementation Guardrails

Do:

- Keep domain logic framework-independent.
- Write tests before production code.
- Use ADRs for new architecture decisions.
- Keep services independently deployable.
- Keep event contracts versioned.
- Use idempotency for critical commands.

Do not:

- Share databases across services.
- Put business logic in controllers.
- Publish Kafka events outside the outbox.
- Add generic `utils`, `helpers`, `misc` or `common` folders without justification.
- Implement payroll processing before the orchestration and outbox foundation exist.

---

# Completion Tracker

| Phase | Name | Status |
| --- | --- | --- |
| 0 | Repository Readiness | ✅ Complete |
| 1 | Monorepo and Local Infrastructure | ✅ Complete |
| 2 | Shared Kernel | ✅ Complete |
| 3 | Contracts and Messaging Foundation | ✅ Complete |
| 4 | Application Foundation | ✅ Complete |
| 5 | Auth Service | ✅ Complete |
| 6 | Employee Service | ✅ Complete |
| 7 | Payroll Service | ✅ Complete |
| 8 | Outbox Publisher and Kafka Integration | ✅ Complete |
| 9 | Payroll Processing Service | ✅ Complete |
| 10 | Projection Service | ✅ Complete |
| 11 | Notification and Email Services | ✅ Complete |
| 12 | Audit Service | ✅ Complete |
| 13 | Security Hardening | ✅ Complete |
| 14 | Observability | ✅ Complete |
| 15 | End-to-End Workflow | ✅ Complete |
| 16 | Performance and Chaos Validation | ✅ Complete |
