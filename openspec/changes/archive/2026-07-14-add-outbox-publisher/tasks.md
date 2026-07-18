# Tasks: Add Outbox Publisher

## Phase 1: Shared Outbox Library

- [x] 1.1 Generate `libs/transactional-outbox/` via Nx generator
- [x] 1.2 Create `lib/outbox-store.ts` — port interface
- [x] 1.3 Create `lib/outbox-publisher.ts` — port interface
- [x] 1.4 Create `lib/typeorm-outbox.entity.ts` — entity with retry_count + last_error
- [x] 1.5 Create `lib/typeorm-outbox.repository.ts` — implements OutboxStore
- [x] 1.6 Create `lib/transactional-outbox.module.ts` — NestJS module
- [x] 1.7 Create `lib/index.ts` — barrel exports
- [x] 1.8 Update `project.json` — build, test, lint targets
- [x] 1.9 Unit tests for outbox repository

## Phase 2: Kafka Publisher

- [x] 2.1 Create `lib/kafka-outbox-publisher.ts` — implements OutboxPublisher
- [x] 2.2 Create `lib/kafka.config.ts` — env-based config
- [x] 2.3 Unit tests for KafkaOutboxPublisher (mocked producer)
- [ ] 2.4 Integration test: save → publish → verify Kafka message
- [ ] 2.5 Integration test: Kafka unavailable → record stays unpublished

## Phase 3: Migration + Wiring

- [x] 3.1 Add migration for `retry_count` + `last_error` columns to payroll-service outbox
- [x] 3.2 Update payroll-service to use shared `TransactionalOutboxModule`
- [x] 3.3 Wire `KafkaOutboxPublisher` as a background worker in payroll-service
- [x] 3.4 All existing payroll-service tests still pass

## Phase 4: Verify

- [x] 4.1 `nx test transactional-outbox` — all tests pass
- [x] 4.2 `nx build transactional-outbox` — clean build
- [x] 4.3 `nx lint transactional-outbox` — 0 errors
- [x] 4.4 `nx test payroll-service` — all existing tests still pass
- [x] 4.5 `nx build payroll-service` — clean build
- [x] 4.6 `nx lint payroll-service` — 0 errors

## Phase 5: Roadmap

- [ ] 5.1 Update `docs/09-tracking/implementation-roadmap.md` — mark Phase 8 complete

## Notes

- Integration tests (2.4, 2.5) require a running Kafka instance (docker-compose up).
- Roadmap update (5.1) is a docs-only task.
