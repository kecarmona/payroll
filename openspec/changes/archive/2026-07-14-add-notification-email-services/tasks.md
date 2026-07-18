# Tasks: Add Notification and Email Services

## Phase 1: Notification Service

- [x] 1.1 Generate `apps/notification-service/` via Nx
- [x] 1.2 Add tsconfig paths, jest config, project.json targets
- [ ] 1.3 Add service-foundation modules
- [x] 1.4 `domain/notification-request.entity.ts` — aggregate
- [x] 1.5 `domain/notification-request.repository.ts` — port
- [x] 1.6 `domain/processed-event-store.ts` — port
- [x] 1.7 `infrastructure/persistence/typeorm-notification-request.entity.ts`
- [x] 1.8 `infrastructure/persistence/typeorm-notification-request.repository.ts`
- [x] 1.9 `infrastructure/persistence/typeorm-processed-event.entity.ts`
- [x] 1.10 `infrastructure/notification.module.ts`
- [x] 1.11 `application/handle-payslip-generated.command.ts`
- [x] 1.12 `interface/kafka/notification-consumer.ts`
- [x] 1.13 Unit tests for all components

## Phase 2: Email Service

- [x] 2.1 Generate `apps/email-service/` via Nx
- [x] 2.2 `domain/email-delivery.entity.ts` — aggregate
- [x] 2.3 `domain/email-sender.ts` — port interface
- [x] 2.4 `infrastructure/dev-email-adapter.ts` — logs email
- [x] 2.5 `infrastructure/persistence/typeorm-email-delivery.entity.ts`
- [x] 2.6 `infrastructure/email.module.ts`
- [x] 2.7 `application/handle-email-notification.command.ts`
- [x] 2.8 `interface/kafka/email-consumer.ts`
- [x] 2.9 Unit tests for all components

## Phase 3: Wiring

- [x] 3.1 Wire both services (AppModule, main.ts, Swagger)
- [ ] 3.2 Add topic `notification.events` to TopicRegistry

## Phase 4: Verify

- [x] 4.1 `nx test notification-service` — all tests pass
- [x] 4.2 `nx build notification-service` — clean build
- [x] 4.3 `nx lint notification-service` — 0 errors
- [x] 4.4 `nx test email-service` — all tests pass
- [x] 4.5 `nx build email-service` — clean build
- [x] 4.6 `nx lint email-service` — 0 errors

## Phase 5: Roadmap

- [ ] 5.1 Update `docs/09-tracking/implementation-roadmap.md` — mark Phase 11 complete
