# Tasks: Add Payroll Processing Service

## Phase 1: Service Scaffold

- [ ] 1.1 Generate `apps/payroll-processing-service/` via Nx generator
- [ ] 1.2 Add tsconfig paths, jest config, project.json targets
- [ ] 1.3 Add service-foundation modules (CorrelationId, Logger, Config, ValidationPipe, Health, ExceptionFilter)

## Phase 2: Domain

- [ ] 2.1 `domain/payroll-transaction-status.ts` — enum + state machine (PENDING → PROCESSING → COMPLETED/FAILED)
- [ ] 2.2 `domain/payroll-transaction.entity.ts` — aggregate with version (optimistic locking)
- [ ] 2.3 `domain/payroll-transaction.repository.ts` — port interface
- [ ] 2.4 `domain/payslip.entity.ts` — immutable aggregate
- [ ] 2.5 `domain/payslip.repository.ts` — port interface
- [ ] 2.6 `domain/payroll-calculation.service.ts` — domain service (stub)
- [ ] 2.7 `domain/processed-event-store.ts` — port for idempotent consumption
- [ ] 2.8 `domain/events/` — PayrollTransactionCreated, PayrollTransactionCompleted, PayrollTransactionFailed, PayslipGenerated
- [ ] 2.9 Unit tests for transaction state machine
- [ ] 2.10 Unit tests for payslip creation rules
- [ ] 2.11 Unit tests for payroll calculation stub

## Phase 3: Application

- [ ] 3.1 `application/process-payroll-job.command.ts` — consume event, create transactions
- [ ] 3.2 `application/process-transaction.command.ts` — process single transaction
- [ ] 3.3 `application/processed-event-store.ts` — port for idempotency
- [ ] 3.4 Unit tests for process-payroll-job
- [ ] 3.5 Unit tests for process-transaction

## Phase 4: Infrastructure

- [ ] 4.1 `infrastructure/persistence/typeorm-payroll-transaction.entity.ts`
- [ ] 4.2 `infrastructure/persistence/typeorm-payslip.entity.ts`
- [ ] 4.3 `infrastructure/persistence/typeorm-payroll-transaction.repository.ts`
- [ ] 4.4 `infrastructure/persistence/typeorm-payslip.repository.ts`
- [ ] 4.5 `infrastructure/persistence/typeorm-processed-event.entity.ts`
- [ ] 4.6 `infrastructure/persistence/typeorm-processed-event.repository.ts`
- [ ] 4.7 `infrastructure/payroll-processing.module.ts` — NestJS module
- [ ] 4.8 Unit tests for all repositories

## Phase 5: Interface (Kafka Consumer)

- [ ] 5.1 `interface/kafka/payroll-job-consumer.ts` — consumes PayrollJobCreated
- [ ] 5.2 `interface/kafka/kafka-consumer.service.ts` — Kafka connection + topic subscription
- [ ] 5.3 Unit tests for consumer (mocked Kafka)

## Phase 6: Wiring

- [ ] 6.1 `app.module.ts` — import all modules, configure TypeORM + Kafka
- [ ] 6.2 `main.ts` — bootstrap, health check
- [ ] 6.3 `tsconfig.app.json` — path aliases for shared libs

## Phase 7: Verify

- [ ] 7.1 `nx test payroll-processing-service` — all tests pass
- [ ] 7.2 `nx build payroll-processing-service` — clean build
- [ ] 7.3 `nx lint payroll-processing-service` — 0 errors
- [ ] 7.4 `nx test payroll-service` — existing tests still pass

## Phase 8: Roadmap

- [ ] 8.1 Update `docs/09-tracking/implementation-roadmap.md` — mark Phase 9 complete
