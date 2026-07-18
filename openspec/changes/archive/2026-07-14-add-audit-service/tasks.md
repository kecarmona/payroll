# Tasks: Add Audit Service

## Phase 1: Service Scaffold

- [x] 1.1 Generate `apps/audit-service/` via Nx — done (pre-existing scaffold)
- [x] 1.2 Add tsconfig paths, jest config, project.json targets — done (added tsconfig paths, spec config)
- [x] 1.3 Add service-foundation modules — done (ConfigModule, TypeOrmModule)

## Phase 2: Domain

- [x] 2.1 `domain/audit-record.entity.ts` — immutable record
- [x] 2.2 `domain/audit-record.repository.ts` — port
- [x] 2.3 `domain/redaction.service.ts` — sensitive field redaction
- [x] 2.4 `domain/processed-event-store.ts` — idempotency port
- [x] 2.5 Unit tests for redaction (7 tests)
- [x] 2.6 Unit tests for audit record creation (7 tests)

## Phase 3: Infrastructure

- [x] 3.1 `infrastructure/persistence/typeorm-audit-record.entity.ts`
- [x] 3.2 `infrastructure/persistence/typeorm-audit-record.repository.ts`
- [x] 3.3 `infrastructure/persistence/typeorm-processed-event.entity.ts`
- [x] 3.4 `infrastructure/audit.module.ts`
- [x] 3.5 Unit tests for repositories (7 tests)

## Phase 4: Interface

- [x] 4.1 `interface/kafka/audit-consumer.ts` — Kafka consumer
- [x] 4.2 `application/record-audit-event.handler.ts` — handler (+ 5 tests)

## Phase 5: Wiring

- [x] 5.1 `app.module.ts` — TypeORM, Kafka consumer, handlers
- [x] 5.2 `main.ts` — bootstrap (pre-existing, works with module changes)

## Phase 6: Verify

- [x] 6.1 `nx test audit-service` — 31 tests passing, 6 suites
- [x] 6.2 `nx build audit-service` — clean build
- [x] 6.3 `nx lint audit-service` — 0 errors

## Phase 7: Roadmap

- [x] 7.1 Update `docs/09-tracking/implementation-roadmap.md` — mark Phase 12 complete
