# Tasks: Auth Service

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1200–1800 |
| 800-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Domain + App) → PR 2 (Infra) → PR 3 (Interface + Wiring + Verify) |
| Delivery strategy | single-pr-default |
| Chain strategy | pending |

Decision needed before apply: Yes (resolved: size:exception)
Chained PRs recommended: Yes (resolved: single-pr with size:exception)
Chain strategy: single-pr (size:exception)
800-line budget risk: High (resolved: size:exception)

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain + Application layer | PR 1 | VOs, entities, domain events, commands, port interfaces; no NestJS deps; base=feature/tracker branch |
| 2 | Infrastructure layer | PR 2 | TypeORM entities, repos, hasher, JWT service, auth module; base=main |
| 3 | Interface + Wiring + Verify + Roadmap | PR 3 | Controller, guards, DTOs, decorator, app.module, main.ts, verify tests, roadmap update; base=main |

## Phase 1: Domain (TDD — test-first)

- [x] 1.1 `domain/user-id.ts` — Id value object + spec
- [x] 1.2 `domain/user-email.ts` — email validation + spec
- [x] 1.3 `domain/user-role.ts` — enum + spec
- [x] 1.4 `domain/password-hasher.ts` — port interface
- [x] 1.5 `domain/events/user-registered.event.ts` + `user-deactivated.event.ts`
- [x] 1.6 `domain/user.entity.ts` — AggregateRoot with events + spec
- [x] 1.7 `domain/refresh-token.entity.ts` + spec
- [x] 1.8 `domain/user.repository.ts` — port interface
- [x] 1.9 `domain/refresh-token.repository.ts` — port interface

## Phase 2: Application (TDD — test-first)

- [x] 2.1 `register-user.command.ts` + handler + spec
- [x] 2.2 `login.command.ts` + handler + spec
- [x] 2.3 `refresh-token.command.ts` + handler + spec
- [x] 2.4 `deactivate-user.command.ts` + handler + spec

## Phase 3: Infrastructure

- [x] 3.1 `infrastructure/auth/bcrypt-password-hasher.ts` + spec
- [x] 3.2 `infrastructure/auth/jwt-token.service.ts` + spec
- [x] 3.3 `infrastructure/persistence/typeorm-user.entity.ts` — @Entity mapping
- [x] 3.4 `infrastructure/persistence/typeorm-refresh-token.entity.ts` — @Entity mapping
- [x] 3.5 `infrastructure/persistence/typeorm-user.repository.ts` + spec
- [x] 3.6 `infrastructure/persistence/typeorm-refresh-token.repository.ts` + spec
- [x] 3.7 `infrastructure/auth.module.ts` — NestJS module wiring

## Phase 4: Interface

- [x] 4.1 DTOs: `register-user.dto.ts`, `login.dto.ts`, `refresh-token.dto.ts`, `token-response.dto.ts`
- [x] 4.2 `interface/guards/jwt-auth.guard.ts` + spec
- [x] 4.3 `interface/guards/roles.guard.ts` + spec
- [x] 4.4 `interface/decorators/current-user.decorator.ts`
- [x] 4.5 `interface/auth.controller.ts` + spec

## Phase 5: Wiring

- [x] 5.1 `app.module.ts` — import AuthModule + service-foundation modules
- [x] 5.2 `main.ts` — global ValidationPipe, exception filter

## Phase 6: Verify

- [x] 6.1 `nx test auth-service` — all tests pass
- [x] 6.2 `nx build auth-service` — clean build
- [x] 6.3 `nx lint auth-service` — passes

## Phase 7: Roadmap

- [x] 7.1 Update `docs/09-tracking/implementation-roadmap.md`
